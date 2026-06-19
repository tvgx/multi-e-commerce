import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  describe('shop context guard', () => {
    it('throws BadRequest when there is no tenant', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(service.getVariantStock('v1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getVariantStock', () => {
    it('sums countOnHand across locations', async () => {
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si1', countOnHand: 3, stockLocation: {} },
        { id: 'si2', countOnHand: 5, stockLocation: {} },
      ]);
      const res = await service.getVariantStock('v1');
      expect(res.totalCount).toBe(8);
      expect(res.variantId).toBe('v1');
    });
  });

  describe('decrementStock', () => {
    it('throws when a variant has no stock locations', async () => {
      prisma.stockItem.findMany.mockResolvedValue([]);
      await expect(
        service.decrementStock([{ variantId: 'v1', quantity: 1 }], 'o1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws on insufficient, non-backorderable stock', async () => {
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si1', variantId: 'v1', stockLocation: { isDefault: true } },
      ]);
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'si1', countOnHand: 1, backorderable: false },
      ]);
      await expect(
        service.decrementStock([{ variantId: 'v1', quantity: 5 }], 'o1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.stockItem.update).not.toHaveBeenCalled();
    });

    it('decrements the locked row and records an outbound movement', async () => {
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si1', variantId: 'v1', stockLocation: { isDefault: true } },
      ]);
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'si1', countOnHand: 10, backorderable: false },
      ]);

      await service.decrementStock([{ variantId: 'v1', quantity: 4 }], 'order-9');

      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si1' },
        data: { countOnHand: { decrement: 4 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: 'v1',
          stockItemId: 'si1',
          quantityDelta: -4,
          reason: 'order_fulfillment',
          orderId: 'order-9',
        }),
      });
    });

    it('spills across locations when the default runs out (INV-2)', async () => {
      // Default location only has 2; another location has 5. Order of 4 should
      // take 2 from the default then 2 from the second location.
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si2', variantId: 'v1', stockLocation: { isDefault: false } },
        { id: 'si1', variantId: 'v1', stockLocation: { isDefault: true } },
      ]);
      prisma.$queryRawUnsafe.mockImplementation((_sql: string, id: string) =>
        Promise.resolve([
          id === 'si1'
            ? { id: 'si1', countOnHand: 2, backorderable: false }
            : { id: 'si2', countOnHand: 5, backorderable: false },
        ]),
      );

      await service.decrementStock([{ variantId: 'v1', quantity: 4 }], 'order-9');

      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si1' },
        data: { countOnHand: { decrement: 2 } },
      });
      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si2' },
        data: { countOnHand: { decrement: 2 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenCalledTimes(2);
    });

    it('does NOT report out-of-stock while another location can cover it (INV-2)', async () => {
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si1', variantId: 'v1', stockLocation: { isDefault: true } },
        { id: 'si2', variantId: 'v1', stockLocation: { isDefault: false } },
      ]);
      prisma.$queryRawUnsafe.mockImplementation((_sql: string, id: string) =>
        Promise.resolve([
          id === 'si1'
            ? { id: 'si1', countOnHand: 0, backorderable: false }
            : { id: 'si2', countOnHand: 3, backorderable: false },
        ]),
      );

      await expect(
        service.decrementStock([{ variantId: 'v1', quantity: 3 }], 'o1'),
      ).resolves.toBe(true);
      // Entire quantity drawn from the non-default location.
      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si2' },
        data: { countOnHand: { decrement: 3 } },
      });
    });

    it('backorders the shortfall on a backorderable location as one movement', async () => {
      prisma.stockItem.findMany.mockResolvedValue([
        { id: 'si1', variantId: 'v1', stockLocation: { isDefault: true } },
      ]);
      prisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'si1', countOnHand: 1, backorderable: true },
      ]);

      await service.decrementStock([{ variantId: 'v1', quantity: 3 }], 'o1');

      // 1 on-hand + 2 backordered = a single decrement of 3.
      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si1' },
        data: { countOnHand: { decrement: 3 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('restoreStock', () => {
    it('re-increments each fulfillment movement and logs a refund movement', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([
        { variantId: 'v1', stockItemId: 'si1', quantityDelta: -4 },
      ]);
      await service.restoreStock('order-9');
      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si1' },
        data: { countOnHand: { increment: 4 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ quantityDelta: 4, reason: 'order_refund' }),
      });
    });

    it('is idempotent — skips when a refund movement already exists (INV-1)', async () => {
      prisma.stockMovement.findFirst.mockResolvedValue({ id: 'm-refund' });

      const res = await service.restoreStock('order-9');

      expect(res).toBe(false);
      expect(prisma.stockMovement.findMany).not.toHaveBeenCalled();
      expect(prisma.stockItem.update).not.toHaveBeenCalled();
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('adjustStock', () => {
    it('throws when the stock item does not exist for the location', async () => {
      prisma.stockItem.findUnique.mockResolvedValue(null);
      await expect(
        service.adjustStock(
          { variantId: 'v1', stockLocationId: 'loc1', quantityDelta: 5, reason: 'recount' },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('applies the delta and records a movement with the user id', async () => {
      prisma.stockItem.findUnique.mockResolvedValue({ id: 'si1' });
      prisma.stockItem.update.mockResolvedValue({ id: 'si1', countOnHand: 15 });

      await service.adjustStock(
        { variantId: 'v1', stockLocationId: 'loc1', quantityDelta: 5, reason: 'recount' },
        'user-1',
      );

      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'si1' },
        data: { countOnHand: { increment: 5 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reason: 'recount', userId: 'user-1', quantityDelta: 5 }),
      });
    });
  });

  describe('getStockMovements', () => {
    it('returns paginated movements with meta', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([{ id: 'm1' }]);
      prisma.stockMovement.count.mockResolvedValue(1);
      const res = await service.getStockMovements('v1', 1, 20);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('getLowStock', () => {
    it('filters DB-side by threshold and returns variants sorted most-urgent first', async () => {
      prisma.stockItem.groupBy.mockResolvedValue([
        { variantId: 'v1', _sum: { countOnHand: 4 } },
        { variantId: 'v2', _sum: { countOnHand: 1 } },
      ]);
      prisma.variant.findMany.mockResolvedValue([
        { id: 'v1', sku: 'SKU1', price: 1000, product: { id: 'p1', name: 'Prod1', status: 'PUBLISHED' } },
        { id: 'v2', sku: 'SKU2', price: 2000, product: { id: 'p2', name: 'Prod2', status: 'PUBLISHED' } },
      ]);

      const res = await service.getLowStock(5);

      // threshold filter is pushed to the DB via groupBy `having`, scoped to shop
      expect(prisma.stockItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['variantId'],
          where: { stockLocation: { shopId: SHOP } },
          having: { countOnHand: { _sum: { lte: 5 } } },
        }),
      );
      // lowest on-hand comes first
      expect(res.data.map((d: any) => d.variantId)).toEqual(['v2', 'v1']);
      expect(res.data[0]).toMatchObject({ sku: 'SKU2', countOnHand: 1, productName: 'Prod2' });
      expect(res.meta).toEqual({ total: 2, threshold: 5 });
    });

    it('short-circuits (no variant query) when nothing is low', async () => {
      prisma.stockItem.groupBy.mockResolvedValue([]);
      const res = await service.getLowStock(3);
      expect(res.data).toEqual([]);
      expect(prisma.variant.findMany).not.toHaveBeenCalled();
    });

    it('rejects a negative threshold', async () => {
      await expect(service.getLowStock(-1)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.stockItem.groupBy).not.toHaveBeenCalled();
    });
  });

  describe('bulkRestock', () => {
    it('increments stock and writes a restock movement per item, in one batch', async () => {
      prisma.stockItem.findFirst
        .mockResolvedValueOnce({ id: 'si1' })
        .mockResolvedValueOnce({ id: 'si2' });
      prisma.stockItem.update
        .mockResolvedValueOnce({ id: 'si1', countOnHand: 15 })
        .mockResolvedValueOnce({ id: 'si2', countOnHand: 8 });

      const res = await service.bulkRestock(
        [
          { variantId: 'v1', stockLocationId: 'loc1', quantity: 5 },
          { variantId: 'v2', stockLocationId: 'loc2', quantity: 3 },
        ],
        'user-1',
      );

      expect(res).toMatchObject({ status: 'restocked', count: 2 });
      expect(prisma.stockItem.update).toHaveBeenCalledTimes(2);
      expect(prisma.stockItem.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'si1' },
        data: { countOnHand: { increment: 5 } },
      });
      expect(prisma.stockMovement.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          variantId: 'v1',
          stockItemId: 'si1',
          quantityDelta: 5,
          reason: 'restock',
          userId: 'user-1',
          shopId: SHOP,
        }),
      });
    });

    it('enforces shop ownership — unknown stock item rolls the batch back', async () => {
      prisma.stockItem.findFirst.mockResolvedValue(null);
      await expect(
        service.bulkRestock([{ variantId: 'v1', stockLocationId: 'loc1', quantity: 5 }], 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.stockItem.update).not.toHaveBeenCalled();
    });

    it('rejects a non-positive quantity before touching the DB', async () => {
      await expect(
        service.bulkRestock([{ variantId: 'v1', stockLocationId: 'loc1', quantity: 0 }], 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.stockItem.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an empty items array', async () => {
      await expect(service.bulkRestock([], 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
