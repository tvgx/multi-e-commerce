import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformCatalogService } from './platform-catalog.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('PlatformCatalogService', () => {
  let service: PlatformCatalogService;
  let prisma: MockPrisma;

  const OWNER = 'owner-1';
  const SHOP_A = 'shop-a';
  const SHOP_B = 'shop-b';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformCatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PlatformCatalogService);
  });

  describe('listAllProducts', () => {
    it('rejects a missing owner context', async () => {
      await expect(service.listAllProducts('', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns empty (no DB product query) when the owner has no shops', async () => {
      prisma.shop.findMany.mockResolvedValue([]);
      const res = await service.listAllProducts(OWNER, {});
      expect(res.data).toEqual([]);
      expect(res.meta.total).toBe(0);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('aggregates products across owned shops with shop label + min price', async () => {
      prisma.shop.findMany.mockResolvedValue([
        { id: SHOP_A, name: 'Shop A' },
        { id: SHOP_B, name: 'Shop B' },
      ]);
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Áo',
          slug: 'ao',
          status: 'PUBLISHED',
          imageUrl: null,
          images: ['img1'],
          shopId: SHOP_A,
          variants: [
            { price: 200, currency: 'VND' },
            { price: 150, currency: 'VND' },
          ],
          createdAt: new Date(),
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const res = await service.listAllProducts(OWNER, { search: 'áo' });

      // scoped to owned shops
      const arg = prisma.product.findMany.mock.calls[0][0];
      expect(arg.where.shopId).toEqual({ in: [SHOP_A, SHOP_B] });
      expect(arg.where.OR).toBeDefined();
      expect(res.data[0]).toMatchObject({
        id: 'p1',
        shopName: 'Shop A',
        minPrice: 150,
        imageUrl: 'img1', // falls back to images[0]
        variantCount: 2,
      });
      expect(res.shops).toHaveLength(2);
    });

    it('narrows to a single owned shop when shopId filter is valid', async () => {
      prisma.shop.findMany.mockResolvedValue([
        { id: SHOP_A, name: 'Shop A' },
        { id: SHOP_B, name: 'Shop B' },
      ]);
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listAllProducts(OWNER, { shopId: SHOP_B });
      const arg = prisma.product.findMany.mock.calls[0][0];
      expect(arg.where.shopId).toBe(SHOP_B);
    });
  });

  describe('distributeProduct', () => {
    beforeEach(() => {
      prisma.shop.findMany.mockResolvedValue([
        { id: SHOP_A, name: 'Shop A' },
        { id: SHOP_B, name: 'Shop B' },
      ]);
    });

    it('rejects when no target shops are given', async () => {
      await expect(
        service.distributeProduct(OWNER, 'p1', []),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the source product is not owned by the user', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        shopId: 'someone-elses-shop',
        variants: [],
      });
      await expect(
        service.distributeProduct(OWNER, 'p1', [SHOP_B]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('clones into a valid target shop with DRAFT status and resets category', async () => {
      prisma.product.findUnique
        // source lookup (include variants)
        .mockResolvedValueOnce({
          id: 'p1',
          shopId: SHOP_A,
          name: 'Áo',
          slug: 'ao',
          description: 'desc',
          imageUrl: 'img1',
          images: ['img1'],
          variants: [
            { sku: 'AO-1', price: 100, weight: null, currency: 'VND' },
          ],
        })
        // slug existence check in target → none
        .mockResolvedValueOnce(null);
      prisma.variant.findUnique.mockResolvedValue(null); // SKU free
      prisma.product.create.mockResolvedValue({ id: 'p1-clone' });

      const res = await service.distributeProduct(OWNER, 'p1', [SHOP_B]);

      const createArg = prisma.product.create.mock.calls[0][0];
      expect(createArg.data.shopId).toBe(SHOP_B);
      expect(createArg.data.status).toBe('DRAFT');
      expect(createArg.data.categoryId).toBeNull();
      expect(createArg.data.variants.create[0].sku).toBe('AO-1');
      expect(res.created).toBe(1);
      expect(res.results[0].status).toBe('created');
    });

    it('skips a target that already has a product with the same slug', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce({
          id: 'p1',
          shopId: SHOP_A,
          slug: 'ao',
          images: [],
          variants: [],
        })
        .mockResolvedValueOnce({ id: 'existing' }); // slug exists in target

      const res = await service.distributeProduct(OWNER, 'p1', [SHOP_B]);

      expect(prisma.product.create).not.toHaveBeenCalled();
      expect(res.created).toBe(0);
      expect(res.skipped).toBe(1);
      expect(res.results[0].status).toBe('skipped');
    });

    it('suffixes a cloned SKU when it collides in the target shop', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce({
          id: 'p1',
          shopId: SHOP_A,
          slug: 'ao',
          images: [],
          variants: [{ sku: 'AO-1', price: 100, weight: null, currency: 'VND' }],
        })
        .mockResolvedValueOnce(null); // slug free in target
      // First SKU check collides, second is free
      prisma.variant.findUnique
        .mockResolvedValueOnce({ id: 'taken' })
        .mockResolvedValueOnce(null);
      prisma.product.create.mockResolvedValue({ id: 'p1-clone' });

      await service.distributeProduct(OWNER, 'p1', [SHOP_B]);

      const createArg = prisma.product.create.mock.calls[0][0];
      expect(createArg.data.variants.create[0].sku).toBe('AO-1-1');
    });
  });
});
