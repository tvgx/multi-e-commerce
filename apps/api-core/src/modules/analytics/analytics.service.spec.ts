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
        ]),
      );
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
  });
});
