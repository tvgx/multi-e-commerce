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

interface DateRange {
  period: AnalyticsPeriod;
  days: number;
  since: Date;
  prevSince: Date;
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

  /** Điều kiện SQL theo phạm vi shop: 1 shop, danh sách shop, hoặc toàn sàn */
  private scopeSql(shopIds?: string[] | string): Prisma.Sql {
    if (shopIds === undefined) return Prisma.sql`TRUE`;
    if (typeof shopIds === 'string') return Prisma.sql`o."shopId" = ${shopIds}`;
    if (shopIds.length === 0) return Prisma.sql`FALSE`;
    return Prisma.sql`o."shopId" IN (${Prisma.join(shopIds)})`;
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

    const series: { date: string; revenue: number; orders: number }[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < days; i++) {
      const dateStr = cursor.toISOString().split('T')[0];
      const entry = byDay.get(dateStr);
      series.push({ date: dateStr, revenue: entry?.revenue ?? 0, orders: entry?.orders ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return series;
  }

  /** KPI của một khoảng thời gian [from, to) — to bỏ trống nghĩa là đến hiện tại */
  private async collectKpis(shopId: string, from: Date, to?: Date) {
    const createdAt = { gte: from, ...(to ? { lt: to } : {}) };

    const [revenueAgg, totalOrders, canceledOrders, newCustomers, uniqueBuyers] = await Promise.all([
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
    ]);

    const revenue = revenueAgg._sum.totalAmount || 0;
    const orderCount = revenueAgg._count || 0;

    return {
      revenue,
      orderCount,
      aov: orderCount > 0 ? revenue / orderCount : 0,
      newCustomers,
      uniqueBuyers,
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

  /** Gói toàn bộ dữ liệu dashboard trong một request cho UI */
  async getDashboard(period?: string) {
    const [summary, revenueSeries, orderStatus, topProducts, customers] = await Promise.all([
      this.getSummary(period),
      this.getRevenueSeries(period),
      this.getOrdersByStatus(period),
      this.getTopProducts(period),
      this.getCustomerInsights(period),
    ]);

    return {
      summary,
      revenueSeries,
      ordersByState: orderStatus.byState,
      paymentsByState: orderStatus.byPaymentState,
      topProducts,
      customers,
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

    const [revenueAgg, totalOrders, canceledOrders, newCustomers, activeShops] = await Promise.all([
      this.prisma.order.aggregate({
        where: { ...scope, state: { notIn: NON_REVENUE_STATES }, createdAt },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.order.count({ where: { ...scope, state: { not: 'cart' }, createdAt } }),
      this.prisma.order.count({ where: { ...scope, state: 'canceled', createdAt } }),
      this.prisma.customer.count({ where: { ...scope, createdAt } }),
      this.countDistinctOrders('shopId', this.scopeSql(shopIds), from, to),
    ]);

    const revenue = revenueAgg._sum.totalAmount || 0;
    const orderCount = revenueAgg._count || 0;

    return {
      revenue,
      orderCount,
      aov: orderCount > 0 ? revenue / orderCount : 0,
      newCustomers,
      activeShops,
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

  async getPlatformDashboard(shopIds: string[] | undefined, period?: string) {
    const { since } = this.resolveRange(period);

    const [summary, revenueSeries, topShops, byState] = await Promise.all([
      this.getPlatformSummary(shopIds, period),
      this.getPlatformRevenueSeries(shopIds, period),
      this.getTopShops(shopIds, period),
      this.prisma.order.groupBy({
        by: ['state'],
        where: { ...this.shopScope(shopIds), state: { not: 'cart' }, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      summary,
      revenueSeries,
      topShops,
      ordersByState: Object.fromEntries(byState.map((s) => [s.state, s._count])),
    };
  }
}
