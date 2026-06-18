import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(PromotionsService);
  });

  describe('findOne', () => {
    it('throws NotFound when the promotion is not in this shop', async () => {
      prisma.promotion.findFirst.mockResolvedValue(null);
      await expect(service.findOne('p1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('uppercases the supplied code and rejects duplicates', async () => {
      prisma.promotion.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ name: 'X', code: 'save10', discountType: 'fixed', discountValue: 1 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.promotion.findUnique).toHaveBeenCalledWith({
        where: { shopId_code: { shopId: SHOP, code: 'SAVE10' } },
      });
    });

    it('creates a promotion with an uppercased code', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);
      prisma.promotion.create.mockResolvedValue({ id: 'p1' });
      await service.create({
        name: 'Spring',
        code: 'spring',
        discountType: 'percentage',
        discountValue: 10,
      } as any);
      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ shopId: SHOP, code: 'SPRING', isActive: true }),
      });
    });
  });

  describe('update', () => {
    it('verifies ownership before updating', async () => {
      prisma.promotion.findFirst.mockResolvedValue(null); // findOne throws
      await expect(
        service.update('p1', { name: 'New' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.promotion.update).not.toHaveBeenCalled();
    });

    // PROMO-1: discount value/type/dates/limit phải được lưu, không chỉ name/desc/isActive.
    it('persists discount fields and parses dates', async () => {
      prisma.promotion.findFirst.mockResolvedValue({ id: 'p1', shopId: SHOP });
      prisma.promotion.update.mockResolvedValue({ id: 'p1' });
      await service.update('p1', {
        discountType: 'fixed',
        discountValue: 250,
        startsAt: '2026-07-01T00:00:00.000Z',
        expiresAt: '2026-07-31T00:00:00.000Z',
        usageLimit: 100,
      } as any);
      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          discountType: 'fixed',
          discountValue: 250,
          startsAt: new Date('2026-07-01T00:00:00.000Z'),
          expiresAt: new Date('2026-07-31T00:00:00.000Z'),
          usageLimit: 100,
        },
      });
    });

    // PROMO-1: field không gửi thì không được ghi (partial update, tránh xoá nhầm).
    it('omits fields that were not supplied', async () => {
      prisma.promotion.findFirst.mockResolvedValue({ id: 'p1', shopId: SHOP });
      prisma.promotion.update.mockResolvedValue({ id: 'p1' });
      await service.update('p1', { name: 'New' } as any);
      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'New' },
      });
    });
  });

  describe('remove', () => {
    it('verifies ownership before deleting', async () => {
      prisma.promotion.findFirst.mockResolvedValue(null);
      await expect(service.remove('p1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.promotion.delete).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('rejects an inactive/unknown code', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);
      await expect(
        service.validate({ code: 'X', orderSubtotal: 1000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a promotion that has not started', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        isActive: true,
        startsAt: new Date(Date.now() + 86400000),
      });
      await expect(
        service.validate({ code: 'X', orderSubtotal: 1000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired promotion', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        isActive: true,
        expiresAt: new Date(Date.now() - 86400000),
      });
      await expect(
        service.validate({ code: 'X', orderSubtotal: 1000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a promotion at its usage limit', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        isActive: true,
        usageLimit: 5,
        usedCount: 5,
      });
      await expect(
        service.validate({ code: 'X', orderSubtotal: 1000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('computes a percentage discount and final total', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
      });
      const res = await service.validate({ code: 'SAVE10', orderSubtotal: 1000 } as any);
      expect(res).toMatchObject({ valid: true, discountAmount: 100, finalTotal: 900 });
    });

    it('floors the final total at zero for a large fixed discount', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        isActive: true,
        discountType: 'fixed',
        discountValue: 5000,
      });
      const res = await service.validate({ code: 'BIG', orderSubtotal: 1000 } as any);
      expect(res).toMatchObject({ discountAmount: 5000, finalTotal: 0 });
    });
  });
});
