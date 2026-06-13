import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  describe('getShopId guard', () => {
    it('throws BadRequest when tenant context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(service.getSummary()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getSummary', () => {
    beforeEach(() => {
      // Current period has a `gte` only; the previous period also has an `lt`.
      prisma.order.aggregate.mockImplementation(({ where }: any) => {
        const isPrev = where.createdAt.lt !== undefined;
        return Promise.resolve({
          _sum: { totalAmount: isPrev ? 500 : 1000 },
          _count: isPrev ? 5 : 10,
        });
      });
      prisma.order.count.mockImplementation(({ where }: any) =>
        Promise.resolve(where.state === 'canceled' ? 2 : 10),
      );
      prisma.customer.count.mockResolvedValue(7);
      prisma.$queryRaw.mockResolvedValue([{ count: 8 }]); // countDistinctOrders
    });

    it('computes KPIs and percentage change vs the previous period', async () => {
      const res = await service.getSummary('30d');

      expect(res.period).toBe('30d');
      expect(res.current).toMatchObject({
        revenue: 1000,
        orderCount: 10,
        aov: 100,
        newCustomers: 7,
        uniqueBuyers: 8,
        // $queryRaw mock trả [{count: 8}] cho cả buyers lẫn visitors
        visitors: 8,
        conversionRate: 100,
        canceledOrders: 2,
        cancelRate: 20,
      });
      expect(res.previous.revenue).toBe(500);
      // (1000 - 500) / 500 * 100
      expect(res.change.revenue).toBe(100);
    });

    it('defaults an unknown period to 30d', async () => {
      const res = await service.getSummary('bogus');
      expect(res.period).toBe('30d');
    });

    it('returns null change when the previous period had zero revenue', async () => {
      prisma.order.aggregate.mockImplementation(({ where }: any) => {
        const isPrev = where.createdAt.lt !== undefined;
        return Promise.resolve({
          _sum: { totalAmount: isPrev ? 0 : 1000 },
          _count: isPrev ? 0 : 10,
        });
      });
      const res = await service.getSummary('7d');
      expect(res.change.revenue).toBeNull();
    });
  });

  describe('getRevenueSeries', () => {
    it('zero-fills every day in the period when there are no orders', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const res = await service.getRevenueSeries('7d');
      expect(res).toHaveLength(7);
      expect(res.every((d: any) => d.revenue === 0 && d.orders === 0)).toBe(true);
      expect(res[0]).toHaveProperty('date');
    });
  });

  describe('getOrdersByStatus', () => {
    it('maps grouped counts into byState / byPaymentState objects', async () => {
      prisma.order.groupBy
        .mockResolvedValueOnce([
          { state: 'confirmed', _count: 3 },
          { state: 'delivered', _count: 1 },
        ])
        .mockResolvedValueOnce([{ paymentState: 'paid', _count: 4 }]);

      const res = await service.getOrdersByStatus();

      expect(res.byState).toEqual({ confirmed: 3, delivered: 1 });
      expect(res.byPaymentState).toEqual({ paid: 4 });
    });
  });

  describe('getTopProducts', () => {
    it('joins raw revenue rows with variant/product names', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { variantId: 'v1', quantity: 5, revenue: 5000 },
      ]);
      prisma.variant.findMany.mockResolvedValue([
        { id: 'v1', sku: 'SKU1', product: { id: 'p1', name: 'Widget' } },
      ]);

      const res = await service.getTopProducts('30d', '5');

      expect(res).toEqual([
        {
          variantId: 'v1',
          productId: 'p1',
          name: 'Widget',
          sku: 'SKU1',
          quantity: 5,
          revenue: 5000,
        },
      ]);
    });

    it('falls back to sku/variantId when the product is missing', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { variantId: 'v9', quantity: 1, revenue: 10 },
      ]);
      prisma.variant.findMany.mockResolvedValue([]); // variant no longer exists

      const res = await service.getTopProducts();
      expect(res[0]).toMatchObject({ variantId: 'v9', productId: null, name: 'v9' });
    });
  });

  describe('getCustomerInsights', () => {
    it('splits new vs returning buyers and ranks top spenders', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { customerId: 'c1', _sum: { totalAmount: 3000 }, _count: 2 },
        { customerId: 'c2', _sum: { totalAmount: 1000 }, _count: 1 },
      ]);
      // totalCustomers (shopId only) / newCustomers (createdAt) / newBuyers (id in)
      prisma.customer.count.mockImplementation(({ where }: any) => {
        if (where.id) return Promise.resolve(1); // newBuyers
        if (where.createdAt) return Promise.resolve(4); // newCustomers
        return Promise.resolve(20); // totalCustomers
      });
      prisma.customer.findMany.mockResolvedValue([
        { id: 'c1', name: 'Alice', email: 'a@x.dev' },
        { id: 'c2', name: 'Bob', email: 'b@x.dev' },
      ]);

      const res = await service.getCustomerInsights('30d', '5');

      expect(res).toMatchObject({
        totalCustomers: 20,
        newCustomers: 4,
        uniqueBuyers: 2,
        newBuyers: 1,
        returningBuyers: 1,
      });
      expect(res.topCustomers[0]).toMatchObject({
        customerId: 'c1',
        name: 'Alice',
        totalSpent: 3000,
        orderCount: 2,
      });
    });
  });

  describe('getDashboard', () => {
    it('composes all sections in one payload', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      });
      prisma.order.count.mockResolvedValue(0);
      prisma.order.groupBy.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.variant.findMany.mockResolvedValue([]);
      prisma.productReview.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: 0 });
      prisma.productReview.groupBy.mockResolvedValue([]);
      prisma.productReview.count.mockResolvedValue(0);
      prisma.$queryRaw.mockResolvedValue([]);

      const res = await service.getDashboard('30d');

      expect(Object.keys(res)).toEqual(
        expect.arrayContaining([
          'summary',
          'revenueSeries',
          'ordersByState',
          'paymentsByState',
          'topProducts',
          'customers',
          'traffic',
          'funnel',
          'retention',
          'timing',
          'revenueBreakdown',
          'reviews',
          'topSearches',
        ]),
      );
    });
  });

  describe('trackVisit', () => {
    it('records a new visit when no session is open', async () => {
      prisma.shopVisit.findFirst.mockResolvedValue(null);
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP });
      prisma.shopVisit.create.mockResolvedValue({});

      const res = await service.trackVisit({ shopId: SHOP, visitorId: 'vis-1', path: '/home' });

      expect(res).toEqual({ recorded: true });
      expect(prisma.shopVisit.create).toHaveBeenCalledWith({
        data: { shopId: SHOP, visitorId: 'vis-1', customerId: null, path: '/home' },
      });
    });

    it('dedups pings inside the 30-minute session window', async () => {
      prisma.shopVisit.findFirst.mockResolvedValue({ id: 'v1', customerId: 'c1' });

      const res = await service.trackVisit({ shopId: SHOP, visitorId: 'vis-1' });

      expect(res).toEqual({ recorded: false });
      expect(prisma.shopVisit.create).not.toHaveBeenCalled();
      expect(prisma.shopVisit.update).not.toHaveBeenCalled();
    });

    it('attaches customerId to the open session after login', async () => {
      prisma.shopVisit.findFirst.mockResolvedValue({ id: 'v1', customerId: null });

      const res = await service.trackVisit({ shopId: SHOP, visitorId: 'vis-1', customerId: 'c9' });

      expect(res).toEqual({ recorded: false });
      expect(prisma.shopVisit.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { customerId: 'c9' },
      });
    });

    it('rejects a missing shopId or visitorId', async () => {
      await expect(service.trackVisit({ shopId: '', visitorId: 'x' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.trackVisit({ shopId: 's', visitorId: '  ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown shop to avoid junk rows', async () => {
      prisma.shopVisit.findFirst.mockResolvedValue(null);
      prisma.shop.findUnique.mockResolvedValue(null);

      await expect(
        service.trackVisit({ shopId: 'nope', visitorId: 'vis' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getTrafficInsights', () => {
    it('zero-fills the visit series and computes the returning visitor rate', async () => {
      prisma.$queryRaw.mockImplementation((query: any) => {
        const sql = String(query?.sql ?? query);
        if (sql.includes('FILTER')) return Promise.resolve([{ returning: 2, total: 8 }]);
        return Promise.resolve([]);
      });

      const res = await service.getTrafficInsights('7d');

      expect(res.series).toHaveLength(7);
      expect(res.series.every((p: any) => p.visits === 0 && p.visitors === 0)).toBe(true);
      expect(res.returningVisitors).toBe(2);
      expect(res.totalVisitors).toBe(8);
      expect(res.returningVisitorRate).toBe(25);
    });
  });

  describe('getConversionFunnel', () => {
    it('maps each funnel stage from its query', async () => {
      prisma.$queryRaw.mockImplementation((query: any) => {
        const sql = String(query?.sql ?? query);
        if (sql.includes('shop_visits')) return Promise.resolve([{ count: 100 }]);
        if (sql.includes('carts')) return Promise.resolve([{ count: 40 }]);
        if (sql.includes('NOT IN')) return Promise.resolve([{ count: 25 }]); // buyers
        return Promise.resolve([{ count: 20 }]); // completed
      });

      const res = await service.getConversionFunnel('30d');

      expect(res).toEqual({
        visitors: 100,
        cartCustomers: 40,
        buyers: 25,
        completedBuyers: 20,
      });
    });
  });

  describe('getRepeatPurchase', () => {
    it('computes the lifetime repeat purchase rate', async () => {
      prisma.$queryRaw.mockResolvedValue([{ repeat: 3, total: 12 }]);

      const res = await service.getRepeatPurchase();

      expect(res).toEqual({ repeatCustomers: 3, totalPurchasers: 12, repeatPurchaseRate: 25 });
    });
  });

  describe('getOrderTiming', () => {
    it('zero-fills 24 hour buckets and 7 weekday buckets', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{ hour: 20, orders: 5, revenue: 100 }])
        .mockResolvedValueOnce([{ dow: 6, orders: 3, revenue: 60 }]);

      const res = await service.getOrderTiming('7d');

      expect(res.byHour).toHaveLength(24);
      expect(res.byHour[20]).toEqual({ hour: 20, orders: 5, revenue: 100 });
      expect(res.byHour[0]).toEqual({ hour: 0, orders: 0, revenue: 0 });
      expect(res.byDow).toHaveLength(7);
      expect(res.byDow[5]).toEqual({ dow: 6, orders: 3, revenue: 60 });
    });
  });

  describe('getRevenueBreakdown', () => {
    it('returns the revenue composition sums', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1000, itemTotal: 800, promoTotal: 50, taxTotal: 80, shipmentTotal: 120 },
      });

      const res = await service.getRevenueBreakdown('30d');

      expect(res).toEqual({
        total: 1000,
        itemTotal: 800,
        promoTotal: 50,
        taxTotal: 80,
        shipmentTotal: 120,
      });
    });
  });

  describe('getReviewStats', () => {
    it('fills the 1-5 star distribution', async () => {
      prisma.productReview.aggregate.mockResolvedValue({ _avg: { rating: 4.2 }, _count: 10 });
      prisma.productReview.groupBy.mockResolvedValue([
        { rating: 5, _count: 6 },
        { rating: 4, _count: 4 },
      ]);
      prisma.productReview.count.mockResolvedValue(3);

      const res = await service.getReviewStats('30d');

      expect(res.avgRating).toBe(4.2);
      expect(res.totalReviews).toBe(10);
      expect(res.newReviews).toBe(3);
      expect(res.distribution).toEqual([
        { rating: 1, count: 0 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 4 },
        { rating: 5, count: 6 },
      ]);
    });
  });

  describe('platform analytics', () => {
    it('getPlatformSummary returns shop totals scoped to the owner', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1000 },
        _count: 5,
      });
      prisma.order.count.mockResolvedValue(5);
      prisma.customer.count.mockResolvedValue(3);
      prisma.shop.count.mockResolvedValue(2);
      prisma.$queryRaw.mockResolvedValue([{ count: 2 }]); // activeShops

      const res = await service.getPlatformSummary(['s1', 's2'], '30d');

      expect(res.totalShops).toBe(2);
      expect(res.current.activeShops).toBe(2);
      expect(res.period).toBe('30d');
    });

    it('getTopShops ranks shops and computes revenue share', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { shopId: 's1', _sum: { totalAmount: 8000 }, _count: 4 },
        { shopId: 's2', _sum: { totalAmount: 2000 }, _count: 1 },
      ]);
      prisma.shop.findMany.mockResolvedValue([
        { id: 's1', name: 'Shop One', status: 'active' },
        { id: 's2', name: 'Shop Two', status: 'active' },
      ]);

      const res = await service.getTopShops(undefined, '30d');

      expect(res[0]).toMatchObject({
        shopId: 's1',
        name: 'Shop One',
        revenue: 8000,
        revenueShare: 80,
      });
      expect(res[1].revenueShare).toBe(20);
    });

    it('getShopComparison merges per-shop metrics and keeps zero-order shops', async () => {
      prisma.order.groupBy.mockImplementation(({ where }: any) => {
        if (where.state?.notIn) {
          return Promise.resolve([{ shopId: 's1', _sum: { totalAmount: 1000 }, _count: 10 }]);
        }
        if (where.state?.not === 'cart') return Promise.resolve([{ shopId: 's1', _count: 12 }]);
        return Promise.resolve([{ shopId: 's1', _count: 3 }]); // canceled
      });
      prisma.customer.groupBy.mockResolvedValue([{ shopId: 's1', _count: 4 }]);
      prisma.productReview.groupBy.mockResolvedValue([
        { shopId: 's1', _avg: { rating: 4.5 }, _count: 7 },
      ]);
      prisma.$queryRaw.mockImplementation((query: any) => {
        const sql = String(query?.sql ?? query);
        if (sql.includes('shop_visits')) return Promise.resolve([{ shopId: 's1', visitors: 50 }]);
        return Promise.resolve([{ shopId: 's1', buyers: 5 }]);
      });
      prisma.shop.findMany.mockResolvedValue([
        { id: 's1', name: 'Shop One', status: 'PUBLISHED' },
        { id: 's2', name: 'Shop Two', status: 'DRAFT' },
      ]);

      const res = await service.getShopComparison(['s1', 's2'], '30d');

      expect(res).toHaveLength(2);
      expect(res[0]).toMatchObject({
        shopId: 's1',
        revenue: 1000,
        orderCount: 10,
        aov: 100,
        cancelRate: 25, // 3 / 12
        newCustomers: 4,
        visitors: 50,
        buyers: 5,
        conversionRate: 10, // 5 / 50
        avgRating: 4.5,
        reviewCount: 7,
      });
      // Shop chưa có đơn vẫn xuất hiện với số liệu 0
      expect(res[1]).toMatchObject({
        shopId: 's2',
        revenue: 0,
        conversionRate: 0,
        avgRating: null,
      });
    });

    it('getRevenueByShopSeries pivots daily revenue per top shop', async () => {
      prisma.$queryRaw.mockImplementation((query: any) => {
        const sql = String(query?.sql ?? query);
        if (sql.includes('to_char')) {
          // Một ngày bất kỳ trong kỳ — chỉ cần pivot đúng key
          const date = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0];
          return Promise.resolve([
            { date, shopId: 's1', revenue: 100 },
            { date, shopId: 's2', revenue: 50 },
          ]);
        }
        return Promise.resolve([]);
      });
      prisma.shop.findMany.mockResolvedValue([
        { id: 's1', name: 'One' },
        { id: 's2', name: 'Two' },
      ]);

      const res = await service.getRevenueByShopSeries(undefined, '7d');

      expect(res.shops[0]).toEqual({ shopId: 's1', name: 'One' });
      expect(res.series).toHaveLength(7);
      expect(res.series.some((p: any) => p.s1 === 100 && p.s2 === 50)).toBe(true);
      // Ngày không có doanh thu được điền 0 cho từng shop
      expect(res.series.some((p: any) => p.s1 === 0 && p.s2 === 0)).toBe(true);
    });

    it('getNewCustomersSeries zero-fills days without signups', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const res = await service.getNewCustomersSeries(['s1'], '7d');

      expect(res).toHaveLength(7);
      expect(res.every((p: any) => p.count === 0)).toBe(true);
    });
  });
});
