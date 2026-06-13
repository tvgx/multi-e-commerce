import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

// 'cart' = abandoned carts, 'canceled' = hủy đơn — không tính vào doanh thu
const NON_REVENUE_STATES = ['cart', 'canceled'];
// Đơn coi như đã đến tay khách — bước cuối của funnel
const COMPLETED_STATES = ['delivered', 'completed'];
// Một phiên ghé shop: các ping trong vòng 30' tính là cùng một lượt
const VISIT_SESSION_MINUTES = 30;
// Giờ/thứ đặt hàng quy về giờ VN để chủ shop đọc được "khung giờ vàng"
const SHOP_TIMEZONE = 'Asia/Ho_Chi_Minh';

interface DateRange {
  period: AnalyticsPeriod;
  days: number;
  since: Date;
  prevSince: Date;
}

export interface TrackVisitDto {
  shopId?: string;
  visitorId?: string;
  customerId?: string;
  path?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  private resolveRange(period?: string): DateRange {
    const key: AnalyticsPeriod = (period && period in PERIOD_DAYS ? period : '30d') as AnalyticsPeriod;
    const days = PERIOD_DAYS[key];
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1)); // bao gồm cả hôm nay => đủ `days` ngày
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);
    return { period: key, days, since, prevSince };
  }

  private resolveLimit(limit?: string, fallback = 5): number {
    const parsed = parseInt(limit ?? '', 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), 20);
  }

  /**
   * Điều kiện SQL theo phạm vi shop: 1 shop, danh sách shop, hoặc toàn sàn.
   * `alias` là alias của bảng trong câu query (orders → o, shop_visits → v, …)
   */
  private scopeSql(shopIds?: string[] | string, alias = 'o'): Prisma.Sql {
    const col = Prisma.raw(`${alias}."shopId"`);
    if (shopIds === undefined) return Prisma.sql`TRUE`;
    if (typeof shopIds === 'string') return Prisma.sql`${col} = ${shopIds}`;
    if (shopIds.length === 0) return Prisma.sql`FALSE`;
    return Prisma.sql`${col} IN (${Prisma.join(shopIds)})`;
  }

  /** Điền 0 cho ngày trống để chart liền mạch */
  private fillDailySeries<T>(
    since: Date,
    days: number,
    build: (date: string) => T,
  ): T[] {
    const series: T[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < days; i++) {
      series.push(build(cursor.toISOString().split('T')[0]));
      cursor.setDate(cursor.getDate() + 1);
    }
    return series;
  }

  /**
   * Đếm COUNT(DISTINCT cột) trực tiếp trong Postgres — trước đây dùng
   * findMany({ distinct }) nên phải kéo một row mỗi giá trị về Node.
   */
  private async countDistinctOrders(
    column: 'customerId' | 'shopId',
    scope: Prisma.Sql,
    from: Date,
    to?: Date,
  ): Promise<number> {
    const col = column === 'customerId' ? Prisma.sql`o."customerId"` : Prisma.sql`o."shopId"`;
    const rows = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT ${col})::int AS count
      FROM orders o
      WHERE ${scope}
        AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
        AND o."createdAt" >= ${from}
        ${to ? Prisma.sql`AND o."createdAt" < ${to}` : Prisma.empty}
    `);
    return rows[0]?.count ?? 0;
  }

  /** Số khách (visitorId) riêng biệt đã ghé shop trong khoảng [from, to) */
  private async countDistinctVisitors(scope: Prisma.Sql, from: Date, to?: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT v."visitorId")::int AS count
      FROM shop_visits v
      WHERE ${scope}
        AND v."createdAt" >= ${from}
        ${to ? Prisma.sql`AND v."createdAt" < ${to}` : Prisma.empty}
    `);
    return rows[0]?.count ?? 0;
  }

  /**
   * Doanh thu + số đơn theo ngày, gộp bằng date_trunc trong Postgres rồi
   * điền 0 cho ngày trống. Trước đây findMany toàn bộ đơn trong kỳ rồi
   * cộng dồn trong Node — O(số đơn) bộ nhớ cho mỗi request dashboard.
   */
  private async revenueSeriesByDay(scope: Prisma.Sql, since: Date, days: number) {
    const rows = await this.prisma.$queryRaw<
      { date: string; revenue: number; orders: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', o."createdAt"), 'YYYY-MM-DD') AS date,
             SUM(o."totalAmount")::float AS revenue,
             COUNT(*)::int AS orders
      FROM orders o
      WHERE ${scope}
        AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
        AND o."createdAt" >= ${since}
      GROUP BY 1
    `);
    const byDay = new Map(rows.map((r) => [r.date, r]));

    return this.fillDailySeries(since, days, (date) => {
      const entry = byDay.get(date);
      return { date, revenue: entry?.revenue ?? 0, orders: entry?.orders ?? 0 };
    });
  }

  /** KPI của một khoảng thời gian [from, to) — to bỏ trống nghĩa là đến hiện tại */
  private async collectKpis(shopId: string, from: Date, to?: Date) {
    const createdAt = { gte: from, ...(to ? { lt: to } : {}) };

    const [revenueAgg, totalOrders, canceledOrders, newCustomers, uniqueBuyers, visitors] = await Promise.all([
      this.prisma.order.aggregate({
        where: { shopId, state: { notIn: NON_REVENUE_STATES }, createdAt },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { shopId, state: { not: 'cart' }, createdAt },
      }),
      this.prisma.order.count({
        where: { shopId, state: 'canceled', createdAt },
      }),
      this.prisma.customer.count({ where: { shopId, createdAt } }),
      this.countDistinctOrders('customerId', this.scopeSql(shopId), from, to),
      this.countDistinctVisitors(this.scopeSql(shopId, 'v'), from, to),
    ]);

    const revenue = revenueAgg._sum.totalAmount || 0;
    const orderCount = revenueAgg._count || 0;

    return {
      revenue,
      orderCount,
      aov: orderCount > 0 ? revenue / orderCount : 0,
      newCustomers,
      uniqueBuyers,
      visitors,
      // % khách ghé shop có đặt hàng — chỉ tính được khi đã có visit tracking
      conversionRate: visitors > 0 ? (uniqueBuyers / visitors) * 100 : 0,
      canceledOrders,
      cancelRate: totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0,
    };
  }

  /** % thay đổi so với kỳ trước; null khi kỳ trước = 0 (không xác định) */
  private percentChange(current: number, previous: number): number | null {
    if (previous > 0) return ((current - previous) / previous) * 100;
    return current > 0 ? null : 0;
  }

  /** KPI tổng quan kèm so sánh với kỳ liền trước */
  async getSummary(period?: string) {
    const shopId = this.getShopId();
    const { period: key, since, prevSince } = this.resolveRange(period);

    const [current, previous] = await Promise.all([
      this.collectKpis(shopId, since),
      this.collectKpis(shopId, prevSince, since),
    ]);

    return {
      period: key,
      current,
      previous,
      change: {
        revenue: this.percentChange(current.revenue, previous.revenue),
        orderCount: this.percentChange(current.orderCount, previous.orderCount),
        aov: this.percentChange(current.aov, previous.aov),
        newCustomers: this.percentChange(current.newCustomers, previous.newCustomers),
        visitors: this.percentChange(current.visitors, previous.visitors),
        conversionRate: this.percentChange(current.conversionRate, previous.conversionRate),
        cancelRate: this.percentChange(current.cancelRate, previous.cancelRate),
      },
    };
  }

  /** Chuỗi doanh thu + số đơn theo ngày, điền 0 cho ngày trống để vẽ chart liền mạch */
  async getRevenueSeries(period?: string) {
    const shopId = this.getShopId();
    const { since, days } = this.resolveRange(period);
    return this.revenueSeriesByDay(this.scopeSql(shopId), since, days);
  }

  /** Phân bố đơn hàng theo trạng thái xử lý và trạng thái thanh toán */
  async getOrdersByStatus(period?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    const where = { shopId, state: { not: 'cart' }, createdAt: { gte: since } };

    const [byState, byPaymentState] = await Promise.all([
      this.prisma.order.groupBy({ by: ['state'], where, _count: true }),
      this.prisma.order.groupBy({ by: ['paymentState'], where, _count: true }),
    ]);

    return {
      byState: Object.fromEntries(byState.map((s) => [s.state, s._count])),
      byPaymentState: Object.fromEntries(byPaymentState.map((s) => [s.paymentState, s._count])),
    };
  }

  /** Top sản phẩm theo doanh thu (kèm số lượng bán) */
  async getTopProducts(period?: string, limit?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    const take = this.resolveLimit(limit);

    // Doanh thu dòng hàng = price * quantity nên cần raw SQL (groupBy không hỗ trợ biểu thức)
    const rows = await this.prisma.$queryRaw<
      { variantId: string; quantity: number; revenue: number }[]
    >(Prisma.sql`
      SELECT li."variantId",
             SUM(li.quantity)::int AS quantity,
             SUM(li.price * li.quantity)::float AS revenue
      FROM line_items li
      JOIN orders o ON o.id = li."orderId"
      WHERE o."shopId" = ${shopId}
        AND o.state NOT IN ('cart', 'canceled')
        AND o."createdAt" >= ${since}
      GROUP BY li."variantId"
      ORDER BY revenue DESC
      LIMIT ${take}
    `);

    const variants = await this.prisma.variant.findMany({
      where: { id: { in: rows.map((r) => r.variantId) } },
      include: { product: { select: { id: true, name: true } } },
    });
    const variantById = new Map(variants.map((v) => [v.id, v]));

    return rows.map((row) => {
      const variant = variantById.get(row.variantId);
      return {
        variantId: row.variantId,
        productId: variant?.product?.id ?? null,
        name: variant?.product?.name || variant?.sku || row.variantId,
        sku: variant?.sku ?? null,
        quantity: row.quantity,
        revenue: row.revenue,
      };
    });
  }

  /** Thống kê khách hàng: khách mới/quay lại + top khách theo chi tiêu */
  async getCustomerInsights(period?: string, limit?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    const take = this.resolveLimit(limit);

    const [grouped, totalCustomers, newCustomers] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { shopId, state: { notIn: NON_REVENUE_STATES }, createdAt: { gte: since } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.customer.count({ where: { shopId } }),
      this.prisma.customer.count({ where: { shopId, createdAt: { gte: since } } }),
    ]);

    const buyerIds = grouped.map((g) => g.customerId);
    // Khách "quay lại" = có mua trong kỳ nhưng tài khoản tạo trước kỳ này
    const newBuyers = buyerIds.length
      ? await this.prisma.customer.count({
          where: { id: { in: buyerIds }, createdAt: { gte: since } },
        })
      : 0;

    const topGroups = [...grouped]
      .sort((a, b) => (b._sum.totalAmount ?? 0) - (a._sum.totalAmount ?? 0))
      .slice(0, take);
    const topCustomerRecords = await this.prisma.customer.findMany({
      where: { id: { in: topGroups.map((g) => g.customerId) } },
      select: { id: true, name: true, email: true },
    });
    const customerById = new Map(topCustomerRecords.map((c) => [c.id, c]));

    return {
      totalCustomers,
      newCustomers,
      uniqueBuyers: buyerIds.length,
      newBuyers,
      returningBuyers: buyerIds.length - newBuyers,
      topCustomers: topGroups.map((g) => {
        const customer = customerById.get(g.customerId);
        return {
          customerId: g.customerId,
          name: customer?.name || customer?.email || g.customerId,
          email: customer?.email ?? null,
          orderCount: g._count,
          totalSpent: g._sum.totalAmount ?? 0,
        };
      }),
    };
  }

  // ==========================================
  // Visit tracking — beacon public từ storefront
  // ==========================================

  /**
   * Ghi một phiên ghé shop. Các ping trong vòng 30' của cùng visitor được
   * gộp vào một phiên (server-side dedup, không tin client). Khi khách
   * đăng nhập giữa phiên thì chỉ gắn thêm customerId vào phiên đang mở.
   */
  async trackVisit(dto: TrackVisitDto) {
    // Không có global ValidationPipe — validate tay
    const shopId = typeof dto?.shopId === 'string' ? dto.shopId.trim() : '';
    const visitorId = typeof dto?.visitorId === 'string' ? dto.visitorId.trim() : '';
    if (!shopId || !visitorId || shopId.length > 64 || visitorId.length > 64) {
      throw new BadRequestException('shopId and visitorId are required');
    }
    const customerId =
      typeof dto.customerId === 'string' && dto.customerId.trim()
        ? dto.customerId.trim().slice(0, 64)
        : null;
    const path = typeof dto.path === 'string' && dto.path ? dto.path.slice(0, 255) : null;

    const windowStart = new Date(Date.now() - VISIT_SESSION_MINUTES * 60 * 1000);
    const openSession = await this.prisma.shopVisit.findFirst({
      where: { shopId, visitorId, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, customerId: true },
    });

    if (openSession) {
      if (customerId && !openSession.customerId) {
        await this.prisma.shopVisit.update({
          where: { id: openSession.id },
          data: { customerId },
        });
      }
      return { recorded: false };
    }

    // Chặn ghi rác cho shopId không tồn tại (endpoint public)
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) throw new BadRequestException('Shop not found');

    await this.prisma.shopVisit.create({ data: { shopId, visitorId, customerId, path } });
    return { recorded: true };
  }

  // ==========================================
  // Shop insights mở rộng — phục vụ dashboard analytics của chủ shop
  // ==========================================

  /** Lưu lượng ghé shop theo ngày + tỷ lệ khách ghé quay lại trong kỳ */
  async getTrafficInsights(period?: string) {
    const shopId = this.getShopId();
    const { since, days } = this.resolveRange(period);
    const scope = this.scopeSql(shopId, 'v');

    const [seriesRows, retentionRows] = await Promise.all([
      this.prisma.$queryRaw<{ date: string; visits: number; visitors: number }[]>(Prisma.sql`
        SELECT to_char(date_trunc('day', v."createdAt"), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS visits,
               COUNT(DISTINCT v."visitorId")::int AS visitors
        FROM shop_visits v
        WHERE ${scope} AND v."createdAt" >= ${since}
        GROUP BY 1
      `),
      // Khách ghé >= 2 phiên trong kỳ = "ở lại sau lần đầu"
      this.prisma.$queryRaw<{ returning: number; total: number }[]>(Prisma.sql`
        SELECT COUNT(*) FILTER (WHERE c >= 2)::int AS returning,
               COUNT(*)::int AS total
        FROM (
          SELECT v."visitorId", COUNT(*)::int AS c
          FROM shop_visits v
          WHERE ${scope} AND v."createdAt" >= ${since}
          GROUP BY 1
        ) t
      `),
    ]);

    const byDay = new Map(seriesRows.map((r) => [r.date, r]));
    const series = this.fillDailySeries(since, days, (date) => {
      const entry = byDay.get(date);
      return { date, visits: entry?.visits ?? 0, visitors: entry?.visitors ?? 0 };
    });

    const retention = retentionRows[0];
    const totalVisits = seriesRows.reduce((acc, r) => acc + r.visits, 0);
    return {
      totalVisits,
      series,
      returningVisitors: retention?.returning ?? 0,
      totalVisitors: retention?.total ?? 0,
      returningVisitorRate:
        retention && retention.total > 0 ? (retention.returning / retention.total) * 100 : 0,
    };
  }

  /** Funnel trong kỳ: ghé shop → có giỏ hàng → đặt hàng → nhận hàng */
  async getConversionFunnel(period?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);

    const [visitors, cartRows, buyers, completedRows] = await Promise.all([
      this.countDistinctVisitors(this.scopeSql(shopId, 'v'), since),
      // Giỏ server (khách đăng nhập) ∪ đơn còn ở trạng thái cart
      this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT cid)::int AS count
        FROM (
          SELECT c."customerId" AS cid FROM carts c
          WHERE c."shopId" = ${shopId} AND c."updatedAt" >= ${since}
          UNION
          SELECT o."customerId" FROM orders o
          WHERE o."shopId" = ${shopId} AND o.state = 'cart' AND o."updatedAt" >= ${since}
        ) t
      `),
      this.countDistinctOrders('customerId', this.scopeSql(shopId), since),
      this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT o."customerId")::int AS count
        FROM orders o
        WHERE o."shopId" = ${shopId}
          AND o.state IN (${Prisma.join(COMPLETED_STATES)})
          AND o."createdAt" >= ${since}
      `),
    ]);

    return {
      visitors,
      cartCustomers: cartRows[0]?.count ?? 0,
      buyers,
      completedBuyers: completedRows[0]?.count ?? 0,
    };
  }

  /** Tỷ lệ mua lại trọn đời: % khách đã mua quay lại mua >= 2 lần */
  async getRepeatPurchase() {
    const shopId = this.getShopId();
    const rows = await this.prisma.$queryRaw<{ repeat: number; total: number }[]>(Prisma.sql`
      SELECT COUNT(*) FILTER (WHERE c >= 2)::int AS repeat,
             COUNT(*)::int AS total
      FROM (
        SELECT o."customerId", COUNT(*)::int AS c
        FROM orders o
        WHERE o."shopId" = ${shopId}
          AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
        GROUP BY 1
      ) t
    `);
    const row = rows[0];
    return {
      repeatCustomers: row?.repeat ?? 0,
      totalPurchasers: row?.total ?? 0,
      repeatPurchaseRate: row && row.total > 0 ? (row.repeat / row.total) * 100 : 0,
    };
  }

  /** Đơn hàng theo giờ trong ngày + theo thứ (giờ VN) — tìm khung giờ vàng */
  async getOrderTiming(period?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    // createdAt lưu UTC (timestamp không timezone) → đổi sang giờ VN trước khi EXTRACT
    const localTime = Prisma.raw(`(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '${SHOP_TIMEZONE}')`);

    const [hourRows, dowRows] = await Promise.all([
      this.prisma.$queryRaw<{ hour: number; orders: number; revenue: number }[]>(Prisma.sql`
        SELECT EXTRACT(HOUR FROM ${localTime})::int AS hour,
               COUNT(*)::int AS orders,
               SUM(o."totalAmount")::float AS revenue
        FROM orders o
        WHERE o."shopId" = ${shopId}
          AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
          AND o."createdAt" >= ${since}
        GROUP BY 1
      `),
      this.prisma.$queryRaw<{ dow: number; orders: number; revenue: number }[]>(Prisma.sql`
        SELECT EXTRACT(ISODOW FROM ${localTime})::int AS dow,
               COUNT(*)::int AS orders,
               SUM(o."totalAmount")::float AS revenue
        FROM orders o
        WHERE o."shopId" = ${shopId}
          AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
          AND o."createdAt" >= ${since}
        GROUP BY 1
      `),
    ]);

    const byHour = new Map(hourRows.map((r) => [r.hour, r]));
    const byDow = new Map(dowRows.map((r) => [r.dow, r]));
    return {
      byHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: byHour.get(hour)?.orders ?? 0,
        revenue: byHour.get(hour)?.revenue ?? 0,
      })),
      // ISODOW: 1 = Thứ 2 … 7 = Chủ nhật
      byDow: Array.from({ length: 7 }, (_, i) => ({
        dow: i + 1,
        orders: byDow.get(i + 1)?.orders ?? 0,
        revenue: byDow.get(i + 1)?.revenue ?? 0,
      })),
    };
  }

  /** Cơ cấu doanh thu trong kỳ: tiền hàng / phí ship / thuế / giảm giá */
  async getRevenueBreakdown(period?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);

    const agg = await this.prisma.order.aggregate({
      where: { shopId, state: { notIn: NON_REVENUE_STATES }, createdAt: { gte: since } },
      _sum: {
        totalAmount: true,
        itemTotal: true,
        promoTotal: true,
        taxTotal: true,
        shipmentTotal: true,
      },
    });

    return {
      total: agg._sum.totalAmount ?? 0,
      itemTotal: agg._sum.itemTotal ?? 0,
      promoTotal: agg._sum.promoTotal ?? 0,
      taxTotal: agg._sum.taxTotal ?? 0,
      shipmentTotal: agg._sum.shipmentTotal ?? 0,
    };
  }

  /** Đánh giá sản phẩm: điểm trung bình + phân bố sao (all-time) + review mới trong kỳ */
  async getReviewStats(period?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    const published = { shopId, status: 'published' };

    const [agg, grouped, newReviews] = await Promise.all([
      this.prisma.productReview.aggregate({
        where: published,
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.productReview.groupBy({ by: ['rating'], where: published, _count: true }),
      this.prisma.productReview.count({ where: { ...published, createdAt: { gte: since } } }),
    ]);

    const byRating = new Map(grouped.map((g) => [g.rating, g._count]));
    return {
      avgRating: agg._avg.rating ?? 0,
      totalReviews: agg._count ?? 0,
      newReviews,
      distribution: Array.from({ length: 5 }, (_, i) => ({
        rating: i + 1,
        count: byRating.get(i + 1) ?? 0,
      })),
    };
  }

  /** Từ khóa khách tìm nhiều nhất trong kỳ — gợi ý hướng nhập hàng */
  async getTopSearches(period?: string, limit?: string) {
    const shopId = this.getShopId();
    const { since } = this.resolveRange(period);
    const take = this.resolveLimit(limit, 10);

    return this.prisma.$queryRaw<{ query: string; count: number }[]>(Prisma.sql`
      SELECT lower(trim(s.query)) AS query, COUNT(*)::int AS count
      FROM search_history s
      WHERE s."shopId" = ${shopId}
        AND s."createdAt" >= ${since}
        AND trim(s.query) <> ''
      GROUP BY 1
      ORDER BY count DESC
      LIMIT ${take}
    `);
  }

  /** Gói toàn bộ dữ liệu dashboard trong một request cho UI */
  async getDashboard(period?: string) {
    const [
      summary,
      revenueSeries,
      orderStatus,
      topProducts,
      customers,
      traffic,
      funnel,
      retention,
      timing,
      revenueBreakdown,
      reviews,
      topSearches,
    ] = await Promise.all([
      this.getSummary(period),
      this.getRevenueSeries(period),
      this.getOrdersByStatus(period),
      this.getTopProducts(period),
      this.getCustomerInsights(period),
      this.getTrafficInsights(period),
      this.getConversionFunnel(period),
      this.getRepeatPurchase(),
      this.getOrderTiming(period),
      this.getRevenueBreakdown(period),
      this.getReviewStats(period),
      this.getTopSearches(period),
    ]);

    return {
      summary,
      revenueSeries,
      ordersByState: orderStatus.byState,
      paymentsByState: orderStatus.byPaymentState,
      topProducts,
      customers,
      traffic,
      funnel,
      retention,
      timing,
      revenueBreakdown,
      reviews,
      topSearches,
    };
  }

  // ==========================================
  // Platform analytics (Analytics Hub)
  // Tổng hợp trên nhiều shop: shopIds = các shop của owner,
  // undefined = toàn sàn (role ADMIN)
  // ==========================================

  private shopScope(shopIds?: string[]) {
    return shopIds ? { shopId: { in: shopIds } } : {};
  }

  private async collectPlatformKpis(shopIds: string[] | undefined, from: Date, to?: Date) {
    const createdAt = { gte: from, ...(to ? { lt: to } : {}) };
    const scope = this.shopScope(shopIds);

    const [revenueAgg, totalOrders, canceledOrders, newCustomers, activeShops, uniqueBuyers, visitors] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { ...scope, state: { notIn: NON_REVENUE_STATES }, createdAt },
          _sum: { totalAmount: true },
          _count: true,
        }),
        this.prisma.order.count({ where: { ...scope, state: { not: 'cart' }, createdAt } }),
        this.prisma.order.count({ where: { ...scope, state: 'canceled', createdAt } }),
        this.prisma.customer.count({ where: { ...scope, createdAt } }),
        this.countDistinctOrders('shopId', this.scopeSql(shopIds), from, to),
        this.countDistinctOrders('customerId', this.scopeSql(shopIds), from, to),
        this.countDistinctVisitors(this.scopeSql(shopIds, 'v'), from, to),
      ]);

    const revenue = revenueAgg._sum.totalAmount || 0;
    const orderCount = revenueAgg._count || 0;

    return {
      revenue,
      orderCount,
      aov: orderCount > 0 ? revenue / orderCount : 0,
      newCustomers,
      activeShops,
      uniqueBuyers,
      visitors,
      conversionRate: visitors > 0 ? (uniqueBuyers / visitors) * 100 : 0,
      canceledOrders,
      cancelRate: totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0,
    };
  }

  async getPlatformSummary(shopIds: string[] | undefined, period?: string) {
    const { period: key, since, prevSince } = this.resolveRange(period);

    const [current, previous, totalShops, totalCustomers] = await Promise.all([
      this.collectPlatformKpis(shopIds, since),
      this.collectPlatformKpis(shopIds, prevSince, since),
      this.prisma.shop.count({ where: shopIds ? { id: { in: shopIds } } : {} }),
      this.prisma.customer.count({ where: this.shopScope(shopIds) }),
    ]);

    return {
      period: key,
      totalShops,
      totalCustomers,
      current,
      previous,
      change: {
        revenue: this.percentChange(current.revenue, previous.revenue),
        orderCount: this.percentChange(current.orderCount, previous.orderCount),
        aov: this.percentChange(current.aov, previous.aov),
        newCustomers: this.percentChange(current.newCustomers, previous.newCustomers),
        visitors: this.percentChange(current.visitors, previous.visitors),
        conversionRate: this.percentChange(current.conversionRate, previous.conversionRate),
        cancelRate: this.percentChange(current.cancelRate, previous.cancelRate),
      },
    };
  }

  async getPlatformRevenueSeries(shopIds: string[] | undefined, period?: string) {
    const { since, days } = this.resolveRange(period);
    return this.revenueSeriesByDay(this.scopeSql(shopIds), since, days);
  }

  /** Xếp hạng shop theo doanh thu kèm tỷ trọng đóng góp */
  async getTopShops(shopIds: string[] | undefined, period?: string, limit?: string) {
    const { since } = this.resolveRange(period);
    const take = this.resolveLimit(limit, 10);

    const grouped = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: { ...this.shopScope(shopIds), state: { notIn: NON_REVENUE_STATES }, createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalRevenue = grouped.reduce((acc, g) => acc + (g._sum.totalAmount ?? 0), 0);
    const top = [...grouped]
      .sort((a, b) => (b._sum.totalAmount ?? 0) - (a._sum.totalAmount ?? 0))
      .slice(0, take);

    const shops = await this.prisma.shop.findMany({
      where: { id: { in: top.map((g) => g.shopId) } },
      select: { id: true, name: true, status: true },
    });
    const shopById = new Map(shops.map((s) => [s.id, s]));

    return top.map((g) => {
      const shop = shopById.get(g.shopId);
      const revenue = g._sum.totalAmount ?? 0;
      return {
        shopId: g.shopId,
        name: shop?.name || g.shopId,
        status: shop?.status ?? null,
        orderCount: g._count,
        revenue,
        revenueShare: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      };
    });
  }

  /**
   * Bảng so sánh hiệu quả từng shop trong kỳ: doanh thu, đơn, AOV, hủy,
   * khách mới, lượt ghé, tỷ lệ chuyển đổi, điểm đánh giá.
   * Owner thấy đủ các shop của mình; toàn sàn (ADMIN) cap 20 shop theo doanh thu.
   */
  async getShopComparison(shopIds: string[] | undefined, period?: string) {
    const { since } = this.resolveRange(period);
    const scope = this.shopScope(shopIds);
    const createdAt = { gte: since };

    const [revenueGroups, totalGroups, canceledGroups, newCustomerGroups, visitorRows, buyerRows, ratingGroups] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['shopId'],
          where: { ...scope, state: { notIn: NON_REVENUE_STATES }, createdAt },
          _sum: { totalAmount: true },
          _count: true,
        }),
        this.prisma.order.groupBy({
          by: ['shopId'],
          where: { ...scope, state: { not: 'cart' }, createdAt },
          _count: true,
        }),
        this.prisma.order.groupBy({
          by: ['shopId'],
          where: { ...scope, state: 'canceled', createdAt },
          _count: true,
        }),
        this.prisma.customer.groupBy({
          by: ['shopId'],
          where: { ...scope, createdAt },
          _count: true,
        }),
        this.prisma.$queryRaw<{ shopId: string; visitors: number }[]>(Prisma.sql`
          SELECT v."shopId" AS "shopId", COUNT(DISTINCT v."visitorId")::int AS visitors
          FROM shop_visits v
          WHERE ${this.scopeSql(shopIds, 'v')} AND v."createdAt" >= ${since}
          GROUP BY 1
        `),
        this.prisma.$queryRaw<{ shopId: string; buyers: number }[]>(Prisma.sql`
          SELECT o."shopId" AS "shopId", COUNT(DISTINCT o."customerId")::int AS buyers
          FROM orders o
          WHERE ${this.scopeSql(shopIds)}
            AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
            AND o."createdAt" >= ${since}
          GROUP BY 1
        `),
        this.prisma.productReview.groupBy({
          by: ['shopId'],
          where: { ...scope, status: 'published' },
          _avg: { rating: true },
          _count: true,
        }),
      ]);

    const revenueByShop = new Map(revenueGroups.map((g) => [g.shopId, g]));

    let shopList: { id: string; name: string; status: string }[];
    if (shopIds) {
      shopList = await this.prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, name: true, status: true },
      });
    } else {
      // Toàn sàn: lấy top 20 theo doanh thu, thiếu thì bù shop mới nhất
      const rankedIds = [...revenueGroups]
        .sort((a, b) => (b._sum.totalAmount ?? 0) - (a._sum.totalAmount ?? 0))
        .slice(0, 20)
        .map((g) => g.shopId);
      shopList = await this.prisma.shop.findMany({
        where: { id: { in: rankedIds } },
        select: { id: true, name: true, status: true },
      });
      if (shopList.length < 20) {
        const filler = await this.prisma.shop.findMany({
          where: { id: { notIn: rankedIds } },
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 20 - shopList.length,
        });
        shopList = [...shopList, ...filler];
      }
    }

    const totalByShop = new Map(totalGroups.map((g) => [g.shopId, g._count]));
    const canceledByShop = new Map(canceledGroups.map((g) => [g.shopId, g._count]));
    const newCustomersByShop = new Map(newCustomerGroups.map((g) => [g.shopId, g._count]));
    const visitorsByShop = new Map(visitorRows.map((r) => [r.shopId, r.visitors]));
    const buyersByShop = new Map(buyerRows.map((r) => [r.shopId, r.buyers]));
    const ratingByShop = new Map(ratingGroups.map((g) => [g.shopId, g]));

    return shopList
      .map((shop) => {
        const rev = revenueByShop.get(shop.id);
        const revenue = rev?._sum.totalAmount ?? 0;
        const orderCount = rev?._count ?? 0;
        const totalOrders = totalByShop.get(shop.id) ?? 0;
        const canceled = canceledByShop.get(shop.id) ?? 0;
        const visitors = visitorsByShop.get(shop.id) ?? 0;
        const buyers = buyersByShop.get(shop.id) ?? 0;
        const rating = ratingByShop.get(shop.id);
        return {
          shopId: shop.id,
          name: shop.name,
          status: shop.status,
          revenue,
          orderCount,
          aov: orderCount > 0 ? revenue / orderCount : 0,
          cancelRate: totalOrders > 0 ? (canceled / totalOrders) * 100 : 0,
          newCustomers: newCustomersByShop.get(shop.id) ?? 0,
          visitors,
          buyers,
          conversionRate: visitors > 0 ? (buyers / visitors) * 100 : 0,
          avgRating: rating?._avg.rating ?? null,
          reviewCount: rating?._count ?? 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }

  /** Doanh thu theo ngày của top shop — vẽ multi-line so sánh xu hướng */
  async getRevenueByShopSeries(shopIds: string[] | undefined, period?: string, top = 5) {
    const { since, days } = this.resolveRange(period);

    const rows = await this.prisma.$queryRaw<
      { date: string; shopId: string; revenue: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', o."createdAt"), 'YYYY-MM-DD') AS date,
             o."shopId" AS "shopId",
             SUM(o."totalAmount")::float AS revenue
      FROM orders o
      WHERE ${this.scopeSql(shopIds)}
        AND o.state NOT IN (${Prisma.join(NON_REVENUE_STATES)})
        AND o."createdAt" >= ${since}
      GROUP BY 1, 2
    `);

    // Chọn top N shop theo tổng doanh thu trong kỳ
    const totals = new Map<string, number>();
    for (const r of rows) totals.set(r.shopId, (totals.get(r.shopId) ?? 0) + r.revenue);
    const topIds = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([id]) => id);
    const topIdSet = new Set(topIds);

    const shops = topIds.length
      ? await this.prisma.shop.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(shops.map((s) => [s.id, s.name]));

    // Pivot: một điểm mỗi ngày, mỗi shop một key
    const byDate = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (!topIdSet.has(r.shopId)) continue;
      if (!byDate.has(r.date)) byDate.set(r.date, {});
      byDate.get(r.date)![r.shopId] = r.revenue;
    }

    const series = this.fillDailySeries(since, days, (date) => {
      const point: Record<string, number | string> = { date };
      for (const id of topIds) point[id] = byDate.get(date)?.[id] ?? 0;
      return point;
    });

    return {
      shops: topIds.map((id) => ({ shopId: id, name: nameById.get(id) || id })),
      series,
    };
  }

  /** Khách hàng mới theo ngày trên toàn bộ shop trong scope */
  async getNewCustomersSeries(shopIds: string[] | undefined, period?: string) {
    const { since, days } = this.resolveRange(period);

    const rows = await this.prisma.$queryRaw<{ date: string; count: number }[]>(Prisma.sql`
      SELECT to_char(date_trunc('day', c."createdAt"), 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM customers c
      WHERE ${this.scopeSql(shopIds, 'c')} AND c."createdAt" >= ${since}
      GROUP BY 1
    `);
    const byDay = new Map(rows.map((r) => [r.date, r.count]));

    return this.fillDailySeries(since, days, (date) => ({
      date,
      count: byDay.get(date) ?? 0,
    }));
  }

  async getPlatformDashboard(shopIds: string[] | undefined, period?: string) {
    const { since } = this.resolveRange(period);

    const [summary, revenueSeries, topShops, byState, shopComparison, revenueByShop, newCustomersSeries] =
      await Promise.all([
        this.getPlatformSummary(shopIds, period),
        this.getPlatformRevenueSeries(shopIds, period),
        this.getTopShops(shopIds, period),
        this.prisma.order.groupBy({
          by: ['state'],
          where: { ...this.shopScope(shopIds), state: { not: 'cart' }, createdAt: { gte: since } },
          _count: true,
        }),
        this.getShopComparison(shopIds, period),
        this.getRevenueByShopSeries(shopIds, period),
        this.getNewCustomersSeries(shopIds, period),
      ]);

    return {
      summary,
      revenueSeries,
      topShops,
      ordersByState: Object.fromEntries(byState.map((s) => [s.state, s._count])),
      shopComparison,
      revenueByShop,
      newCustomersSeries,
    };
  }
}
