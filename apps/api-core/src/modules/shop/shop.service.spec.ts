import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ShopService } from './shop.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';
import { createMockCache } from '../../../test/helpers/mocks';

describe('ShopService', () => {
  let service: ShopService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let cache: ReturnType<typeof createMockCache>;

  const SHOP = 'shop-1';
  const OWNER = 'owner-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    cache = createMockCache();
    cache.del.mockResolvedValue(undefined); // service chains .catch() on it

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(ShopService);
  });

  describe('getMyShops', () => {
    it('rejects a missing owner context', async () => {
      await expect(service.getMyShops('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lists shops for the owner', async () => {
      prisma.shop.findMany.mockResolvedValue([{ id: SHOP }]);
      const res = await service.getMyShops(OWNER);
      expect(prisma.shop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: OWNER } }),
      );
      expect(res).toEqual([{ id: SHOP }]);
    });
  });

  describe('createShop', () => {
    it('rejects a missing owner context', async () => {
      await expect(
        service.createShop('', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the shop and invalidates the owner shopIds cache', async () => {
      prisma.shop.create.mockResolvedValue({ id: SHOP });
      await service.createShop(OWNER, { name: 'X' } as any);
      expect(prisma.shop.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'X', currency: 'VND', ownerId: OWNER }),
      });
      expect(cache.del).toHaveBeenCalledWith(`user:${OWNER}:shopIds`);
    });
  });

  describe('getShopById / resolveShop', () => {
    it('getShopById throws NotFound for an unknown shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.getShopById('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('resolveShop matches by id or domain', async () => {
      prisma.shop.findFirst.mockResolvedValue({ id: SHOP, domain: 'd', name: 'N' });
      const res = await service.resolveShop('d');
      expect(prisma.shop.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ id: 'd' }, { domain: 'd' }] },
        }),
      );
      expect(res.id).toBe(SHOP);
    });
  });

  describe('updateBankAccount', () => {
    it('upserts the bank account scoped to the current shop', async () => {
      prisma.shopBankAccount.upsert.mockResolvedValue({ shopId: SHOP });
      await service.updateBankAccount({
        bankName: 'VCB',
        accountNumber: '123',
        accountHolder: 'A',
      } as any);
      expect(prisma.shopBankAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP } }),
      );
    });
  });

  describe('getOnboardingProgress', () => {
    it('throws NotFound for an unknown shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.getOnboardingProgress('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('derives step completion from entity counts and flags', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        onboardingStep: 3,
        onboardingStatus: { step5: 'COMPLETED' },
        domainVerified: false,
      });
      prisma.product.count.mockResolvedValue(2);
      prisma.collection.count.mockResolvedValue(0);
      prisma.navigationMenu.count.mockResolvedValue(2);

      const res = await service.getOnboardingProgress(SHOP);

      expect(res.currentStep).toBe(3);
      expect(res.steps.step2.status).toBe('COMPLETED'); // products > 0
      expect(res.steps.step3.status).toBe('PENDING'); // collections 0
      expect(res.steps.step4.status).toBe('COMPLETED'); // menus >= 2
      expect(res.steps.step5.status).toBe('COMPLETED'); // from status map
      expect(res.steps.step8.status).toBe('PENDING'); // domain not verified
    });
  });

  describe('completeOnboardingStep', () => {
    it('throws NotFound for an unknown shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.completeOnboardingStep('x', 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('marks the step complete and publishes on step 8', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        onboardingStep: 7,
        onboardingStatus: {},
      });
      prisma.shop.update.mockResolvedValue({ id: SHOP });

      await service.completeOnboardingStep(SHOP, 8);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: SHOP },
        data: expect.objectContaining({
          onboardingStep: 8,
          onboardingStatus: { step8: 'COMPLETED' },
          status: 'PUBLISHED',
        }),
      });
    });
  });
});
