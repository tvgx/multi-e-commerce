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
  });

  describe('findOneProduct', () => {
    it('throws NotFound when the product is not in this shop', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findOneProduct('p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
    it('addProductToCollection throws NotFound when either is missing', async () => {
      prisma.collection.findFirst.mockResolvedValue({ id: 'col1' });
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.addProductToCollection('col1', 'p1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('addProductToCollection upserts the join row', async () => {
      prisma.collection.findFirst.mockResolvedValue({ id: 'col1' });
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      await service.addProductToCollection('col1', 'p1');
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
