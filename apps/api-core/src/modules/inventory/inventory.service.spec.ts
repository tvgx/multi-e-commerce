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
});
