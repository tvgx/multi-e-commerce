import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ShopService } from './shop.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';
import { createMockCache } from '../../../test/helpers/mocks';

jest.mock('dns/promises', () => ({ resolveTxt: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolveTxt } = require('dns/promises');
const mockResolveTxt = resolveTxt as jest.Mock;

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
        onboardingStatus: { step4: 'COMPLETED' },
        domain: 'mystore.example',
      });
      prisma.product.count.mockResolvedValue(2);
      prisma.collection.count.mockResolvedValue(0);

      const res = await service.getOnboardingProgress(SHOP);

      expect(res.currentStep).toBe(3);
      expect(res.steps.step2.status).toBe('COMPLETED'); // products > 0
      expect(res.steps.step3.status).toBe('PENDING'); // collections 0
      expect(res.steps.step4.status).toBe('COMPLETED'); // from status map
      expect(res.steps.step5.status).toBe('PENDING'); // no payment methods
      expect((res.steps as Record<string, unknown>).step7).toBeUndefined(); // Verify Domain step removed
    });
  });

  describe('getWarehouse', () => {
    it('reads only the default stock location (no full-shop fetch)', async () => {
      prisma.stockLocation.findFirst.mockResolvedValue({ id: 'sl-1', addressLine: '1 Le Loi' });

      const res = await service.getWarehouse(SHOP);

      const arg = prisma.stockLocation.findFirst.mock.calls[0][0];
      expect(arg.where).toEqual({ shopId: SHOP, isDefault: true });
      expect(arg.select.addressLine).toBe(true);
      // does not pull the shop row to get the warehouse
      expect(prisma.shop.findUnique).not.toHaveBeenCalled();
      expect(res).toEqual({ id: 'sl-1', addressLine: '1 Le Loi' });
    });

    it('returns null when no warehouse is set yet', async () => {
      prisma.stockLocation.findFirst.mockResolvedValue(null);
      expect(await service.getWarehouse(SHOP)).toBeNull();
    });
  });

  describe('completeOnboardingStep', () => {
    it('throws NotFound for an unknown shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.completeOnboardingStep('x', 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('marks the step complete and publishes on the final step (6)', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        onboardingStep: 5,
        onboardingStatus: {},
      });
      prisma.shop.update.mockResolvedValue({ id: SHOP });

      await service.completeOnboardingStep(SHOP, 6);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: SHOP },
        data: expect.objectContaining({
          onboardingStep: 6,
          onboardingStatus: { step6: 'COMPLETED' },
          status: 'PUBLISHED',
        }),
      });
    });
  });

  describe('setCustomDomain (P0-2)', () => {
    beforeEach(() => {
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP });
      prisma.shop.findFirst.mockResolvedValue(null); // not taken
      prisma.shop.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: SHOP, customDomain: data.customDomain, domainVerified: data.domainVerified }),
      );
    });

    it('normalizes scheme/path/case and resets verification, returns TXT record', async () => {
      const res = await service.setCustomDomain(SHOP, 'https://Store.Example.com/path');

      expect(prisma.shop.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SHOP },
          data: { customDomain: 'store.example.com', domainVerified: false },
        }),
      );
      expect(res.customDomain).toBe('store.example.com');
      expect(res.verification).toEqual({
        type: 'TXT',
        host: '@',
        value: `shopVolo-verification=${SHOP}`,
      });
    });

    it('rejects an invalid hostname', async () => {
      await expect(service.setCustomDomain(SHOP, 'not a domain')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.shop.update).not.toHaveBeenCalled();
    });

    it('rejects a platform hostname (localhost / subdomain of platform)', async () => {
      await expect(service.setCustomDomain(SHOP, 'shop.localhost')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a domain already taken by another shop', async () => {
      prisma.shop.findFirst.mockResolvedValue({ id: 'other-shop' });
      await expect(
        service.setCustomDomain(SHOP, 'store.example.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyCustomDomain (P0-2)', () => {
    it('throws when no custom domain is configured', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, customDomain: null });
      await expect(service.verifyCustomDomain(SHOP)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('marks verified when a TXT record matches the expected value', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, customDomain: 'store.example.com' });
      // TXT records arrive as chunk arrays; one chunk split to exercise join()
      mockResolveTxt.mockResolvedValue([
        ['unrelated=1'],
        ['shopVolo-verification=', SHOP],
      ]);
      prisma.shop.update.mockResolvedValue({ id: SHOP, customDomain: 'store.example.com', domainVerified: true });

      const res = await service.verifyCustomDomain(SHOP);

      expect(mockResolveTxt).toHaveBeenCalledWith('store.example.com');
      expect(prisma.shop.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { domainVerified: true } }),
      );
      expect(res.domainVerified).toBe(true);
    });

    it('rejects when no TXT record matches', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, customDomain: 'store.example.com' });
      mockResolveTxt.mockResolvedValue([['something-else']]);
      await expect(service.verifyCustomDomain(SHOP)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.shop.update).not.toHaveBeenCalled();
    });

    it('rejects (not crash) when DNS lookup fails', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: SHOP, customDomain: 'store.example.com' });
      mockResolveTxt.mockRejectedValue(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }));
      await expect(service.verifyCustomDomain(SHOP)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('resolveByHost (P0-2)', () => {
    it('returns the slug for a verified custom domain', async () => {
      prisma.shop.findFirst.mockResolvedValue({ id: SHOP, domain: 'my-slug' });
      const res = await service.resolveByHost('Store.Example.com:443');
      expect(prisma.shop.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customDomain: 'store.example.com', domainVerified: true },
        }),
      );
      expect(res).toEqual({ id: SHOP, slug: 'my-slug' });
    });

    it('returns null for an unknown/unverified host', async () => {
      prisma.shop.findFirst.mockResolvedValue(null);
      expect(await service.resolveByHost('unknown.com')).toBeNull();
    });
  });
});
