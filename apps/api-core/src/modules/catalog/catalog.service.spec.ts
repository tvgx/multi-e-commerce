import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  describe('findAllProducts', () => {
    it('builds search/price/in-stock filters and returns meta', async () => {
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      prisma.product.count.mockResolvedValue(1);

      const res = await service.findAllProducts({
        search: 'shoe',
        minPrice: 100,
        maxPrice: 500,
        inStockOnly: true,
        categoryId: 'cat1',
        status: 'ACTIVE',
      } as any);

      const where = prisma.product.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        shopId: SHOP,
        status: 'ACTIVE',
        categoryId: 'cat1',
      });
      expect(where.OR).toHaveLength(3); // name / description / variant sku
      expect(where.variants.some.price).toEqual({ gte: 100, lte: 500 });
      expect(where.variants.some.stockItems).toBeDefined();
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('falls back to createdAt desc for an unknown sortBy column (no Prisma 500)', async () => {
      // No global ValidationPipe runs, so sortBy/sortOrder arrive raw from the
      // public query string. An arbitrary column would otherwise reach Prisma's
      // orderBy verbatim and throw PrismaClientValidationError (500).
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAllProducts({
        sortBy: 'name); DROP TABLE products;--',
        sortOrder: 'sideways',
      } as any);

      expect(prisma.product.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it('honors an allowlisted sortBy column and normalizes the direction', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAllProducts({ sortBy: 'name', sortOrder: 'ASC' } as any);

      expect(prisma.product.findMany.mock.calls[0][0].orderBy).toEqual({
        name: 'asc',
      });
    });
  });

  describe('findOneProduct', () => {
    it('throws NotFound when the product is not in this shop', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findOneProduct('p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('attaches the published-review rating rollup (REV-2)', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1', variants: [] });
      prisma.productReview.groupBy.mockResolvedValue([
        { productId: 'p1', _avg: { rating: 4.5 }, _count: { _all: 2 } },
      ]);

      const res = await service.findOneProduct('p1');

      expect(prisma.productReview.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['productId'],
          where: { shopId: SHOP, productId: { in: ['p1'] }, status: 'published' },
        }),
      );
      expect(res).toMatchObject({ id: 'p1', ratingAvg: 4.5, ratingCount: 2 });
    });

    it('defaults rating to 0 when a product has no reviews', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1', variants: [] });
      prisma.productReview.groupBy.mockResolvedValue([]);
      const res = await service.findOneProduct('p1');
      expect(res).toMatchObject({ ratingAvg: 0, ratingCount: 0 });
    });
  });

  describe('createProduct', () => {
    it('defaults status to DRAFT and marks the first variant as master', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p1', variants: [] });
      await service.createProduct({
        name: 'Tee',
        slug: 'tee',
        variants: [
          { sku: 'A', price: 100 },
          { sku: 'B', price: 200 },
        ],
      } as any);

      const data = prisma.product.create.mock.calls[0][0].data;
      expect(data.status).toBe('DRAFT');
      expect(data.variants.create[0]).toMatchObject({ sku: 'A', isMaster: true, currency: 'VND' });
      expect(data.variants.create[1]).toMatchObject({ sku: 'B', isMaster: false });
    });

    it('links collections when collectionIds are supplied (CAT-3)', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p1', variants: [] });
      prisma.collection.findMany.mockResolvedValue([{ id: 'c1' }]);

      await service.createProduct({
        name: 'Tee',
        slug: 'tee',
        collectionIds: ['c1'],
      } as any);

      expect(prisma.productCollection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId_collectionId: { productId: 'p1', collectionId: 'c1' } },
        }),
      );
    });
  });

  describe('updateProduct', () => {
    it('verifies ownership before updating', async () => {
      prisma.product.findFirst.mockResolvedValue(null); // findOneProduct throws
      await expect(
        service.updateProduct('p1', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the product and reconciles variants in a transaction', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' }); // ownership ok
      prisma.product.update.mockResolvedValue({ id: 'p1' });
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', variants: [] });

      await service.updateProduct('p1', {
        name: 'Tee2',
        variants: [{ sku: 'A', price: 150 }],
      } as any);

      expect(prisma.variant.deleteMany).toHaveBeenCalledWith({
        where: { productId: 'p1', shopId: SHOP, sku: { notIn: ['A'] } },
      });
      expect(prisma.variant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId_sku: { shopId: SHOP, sku: 'A' } },
        }),
      );
    });

    it('reconciles collection membership when collectionIds are sent (CAT-3)', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' }); // ownership ok
      prisma.product.update.mockResolvedValue({ id: 'p1' });
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', variants: [] });
      prisma.collection.findMany.mockResolvedValue([{ id: 'c1' }]);

      await service.updateProduct('p1', { name: 'Tee2', collectionIds: ['c1'] } as any);

      // Stale links removed, requested link upserted.
      expect(prisma.productCollection.deleteMany).toHaveBeenCalledWith({
        where: { productId: 'p1', collectionId: { notIn: ['c1'] } },
      });
      expect(prisma.productCollection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId_collectionId: { productId: 'p1', collectionId: 'c1' } },
        }),
      );
    });

    it('clears all collection links when an empty collectionIds array is sent', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.product.update.mockResolvedValue({ id: 'p1' });
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', variants: [] });

      await service.updateProduct('p1', { name: 'Tee2', collectionIds: [] } as any);

      expect(prisma.productCollection.deleteMany).toHaveBeenCalledWith({
        where: { productId: 'p1' },
      });
    });
  });

  describe('removeProduct', () => {
    it('soft-deletes by archiving the product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      await service.removeProduct('p1');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'ARCHIVED' },
      });
    });
  });

  describe('collections', () => {
    it('addProductsToCollection throws NotFound when a product is missing', async () => {
      prisma.collection.findFirst.mockResolvedValue({ id: 'col1' });
      // One id requested but none belong to the shop → length mismatch.
      prisma.product.findMany.mockResolvedValue([]);
      await expect(
        service.addProductsToCollection('col1', ['p1']),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('addProductsToCollection upserts a join row per product', async () => {
      prisma.collection.findFirst.mockResolvedValue({ id: 'col1' });
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      await service.addProductsToCollection('col1', ['p1']);
      expect(prisma.productCollection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId_collectionId: { productId: 'p1', collectionId: 'col1' } },
        }),
      );
    });

    it('getCollectionBySlug throws NotFound when missing', async () => {
      prisma.collection.findFirst.mockResolvedValue(null);
      await expect(
        service.getCollectionBySlug('slug', SHOP),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deleteCollection throws NotFound when missing', async () => {
      prisma.collection.findFirst.mockResolvedValue(null);
      await expect(service.deleteCollection('col1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
