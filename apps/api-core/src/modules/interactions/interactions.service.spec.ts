import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('InteractionsService', () => {
  let service: InteractionsService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const CUSTOMER = 'cust-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue('shop-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(InteractionsService);
  });

  describe('toggleWishlist', () => {
    it('removes the item when it already exists', async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: 'w1' });
      const res = await service.toggleWishlist(CUSTOMER, { productId: 'p1' });
      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({ where: { id: 'w1' } });
      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
      expect(res).toEqual({ status: 'removed', productId: 'p1' });
    });

    it('adds the item when it does not exist', async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue(null);
      const res = await service.toggleWishlist(CUSTOMER, { productId: 'p1' });
      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: { shopId: 'shop-1', customerId: CUSTOMER, productId: 'p1' },
      });
      expect(res).toEqual({ status: 'added', productId: 'p1' });
    });

    it('throws BadRequest when shop context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(
        service.toggleWishlist(CUSTOMER, { productId: 'p1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getWishlist', () => {
    it('returns an empty array without a product lookup when there are no items', async () => {
      prisma.wishlistItem.findMany.mockResolvedValue([]);
      const res = await service.getWishlist(CUSTOMER);
      expect(res).toEqual({ data: [] });
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('joins each wishlist item to its product, null when missing', async () => {
      prisma.wishlistItem.findMany.mockResolvedValue([
        { id: 'w1', productId: 'p1' },
        { id: 'w2', productId: 'p-gone' },
      ]);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Widget' }]);

      const res = await service.getWishlist(CUSTOMER);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['p1', 'p-gone'] }, shopId: 'shop-1' },
        }),
      );
      expect(res.data[0].product).toEqual({ id: 'p1', name: 'Widget' });
      expect(res.data[1].product).toBeNull();
    });
  });

  describe('removeWishlistItem', () => {
    it('throws NotFound when nothing matched', async () => {
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 0 });
      await expect(
        service.removeWishlistItem(CUSTOMER, 'p1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes the wishlist item scoped to shop + customer', async () => {
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });
      const res = await service.removeWishlistItem(CUSTOMER, 'p1');
      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { shopId: 'shop-1', customerId: CUSTOMER, productId: 'p1' },
      });
      expect(res).toEqual({ status: 'removed', productId: 'p1' });
    });
  });

  describe('createReview', () => {
    it('rejects when the customer has no delivered order for the product', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(
        service.createReview(CUSTOMER, { productId: 'p1', rating: 5 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.productReview.create).not.toHaveBeenCalled();
    });

    it('creates a published review tied to the delivered order', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'order-9' });
      prisma.productReview.findFirst.mockResolvedValue(null); // no prior review
      prisma.productReview.create.mockResolvedValue({ id: 'rev-1' });

      const res = await service.createReview(CUSTOMER, {
        productId: 'p1',
        rating: 4,
        title: 'Nice',
        body: 'Works well',
      } as any);

      // Both delivered and completed orders qualify (admin advances the state).
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            state: { in: ['delivered', 'completed'] },
          }),
        }),
      );
      expect(prisma.productReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId: 'shop-1',
          customerId: CUSTOMER,
          productId: 'p1',
          orderId: 'order-9',
          rating: 4,
          status: 'published',
        }),
      });
      expect(res).toEqual({ status: 'created', review: { id: 'rev-1' } });
    });

    it('rejects a duplicate review for the same product', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'order-9' });
      prisma.productReview.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createReview(CUSTOMER, { productId: 'p1', rating: 5 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.productReview.create).not.toHaveBeenCalled();
    });
  });

  describe('updateReview', () => {
    it('throws NotFound when the review is not owned by the customer', async () => {
      prisma.productReview.findFirst.mockResolvedValue(null);
      await expect(
        service.updateReview(CUSTOMER, 'rev-1', { rating: 3 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the editable review fields', async () => {
      prisma.productReview.findFirst.mockResolvedValue({ id: 'rev-1' });
      prisma.productReview.update.mockResolvedValue({ id: 'rev-1', rating: 3 });
      const res = await service.updateReview(CUSTOMER, 'rev-1', {
        rating: 3,
        title: 'Meh',
        body: 'ok',
      } as any);
      expect(prisma.productReview.update).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: { rating: 3, title: 'Meh', body: 'ok' },
      });
      expect(res.status).toBe('updated');
    });
  });

  describe('deleteReview', () => {
    it('throws NotFound when absent', async () => {
      prisma.productReview.findFirst.mockResolvedValue(null);
      await expect(service.deleteReview(CUSTOMER, 'rev-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes an owned review', async () => {
      prisma.productReview.findFirst.mockResolvedValue({ id: 'rev-1' });
      const res = await service.deleteReview(CUSTOMER, 'rev-1');
      expect(prisma.productReview.delete).toHaveBeenCalledWith({ where: { id: 'rev-1' } });
      expect(res).toEqual({ status: 'deleted', id: 'rev-1' });
    });
  });

  describe('getReviews', () => {
    it('lists only published reviews with pagination meta', async () => {
      prisma.productReview.findMany.mockResolvedValue([{ id: 'rev-1', customerId: CUSTOMER }]);
      prisma.productReview.count.mockResolvedValue(1);
      prisma.productReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
      prisma.customer.findMany.mockResolvedValue([{ id: CUSTOMER, name: 'An' }]);

      const res = await service.getReviews({ productId: 'p1', page: 1, limit: 20 });

      expect(prisma.productReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: 'shop-1', status: 'published', productId: 'p1' },
          skip: 0,
          take: 20,
        }),
      );
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(res.stats).toEqual({ average: 4.5, total: 1 });
      expect(res.data[0].customerName).toBe('An');
    });

    it('computes skip from page and totalPages from total', async () => {
      prisma.productReview.findMany.mockResolvedValue([]);
      prisma.productReview.count.mockResolvedValue(45);
      prisma.productReview.aggregate.mockResolvedValue({ _avg: { rating: null } });
      const res = await service.getReviews({ page: 3, limit: 20 } as any);
      expect(prisma.productReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(res.meta.totalPages).toBe(3);
    });
  });

  describe('getAdminReviews', () => {
    it('filters by status/product and hydrates product + customer', async () => {
      prisma.productReview.findMany.mockResolvedValue([
        { id: 'rev-1', productId: 'p1', customerId: CUSTOMER },
      ]);
      prisma.productReview.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Widget' }]);
      prisma.customer.findMany.mockResolvedValue([{ id: CUSTOMER, name: 'Alice' }]);

      const res = await service.getAdminReviews({
        productId: 'p1',
        status: 'hidden',
        page: 1,
        limit: 20,
      } as any);

      expect(prisma.productReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: 'shop-1', productId: 'p1', status: 'hidden' },
        }),
      );
      expect(res.data[0].product).toEqual({ id: 'p1', name: 'Widget' });
      expect(res.data[0].customer).toEqual({ id: CUSTOMER, name: 'Alice' });
    });
  });

  describe('updateReviewStatus', () => {
    it('rejects a status outside the allowed set (manual validation)', async () => {
      await expect(
        service.updateReviewStatus('rev-1', { status: 'bogus' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.productReview.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFound when the review is not in this shop', async () => {
      prisma.productReview.findFirst.mockResolvedValue(null);
      await expect(
        service.updateReviewStatus('rev-1', { status: 'hidden' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the status for an existing review', async () => {
      prisma.productReview.findFirst.mockResolvedValue({ id: 'rev-1' });
      prisma.productReview.update.mockResolvedValue({ id: 'rev-1', status: 'hidden' });
      const res = await service.updateReviewStatus('rev-1', { status: 'hidden' });
      expect(prisma.productReview.update).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: { status: 'hidden' },
      });
      expect(res.status).toBe('updated');
    });
  });

  describe('search history', () => {
    it('records a search query', async () => {
      const res = await service.addSearchHistory(CUSTOMER, { query: 'shoes' });
      expect(prisma.searchHistory.create).toHaveBeenCalledWith({
        data: { shopId: 'shop-1', customerId: CUSTOMER, query: 'shoes' },
      });
      expect(res).toEqual({ status: 'added', query: 'shoes' });
    });

    it('returns the latest 20 history entries', async () => {
      prisma.searchHistory.findMany.mockResolvedValue([{ id: 's1' }]);
      const res = await service.getSearchHistory(CUSTOMER);
      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, orderBy: { createdAt: 'desc' } }),
      );
      expect(res.data).toEqual([{ id: 's1' }]);
    });

    it('clears history and reports the count', async () => {
      prisma.searchHistory.deleteMany.mockResolvedValue({ count: 7 });
      const res = await service.clearSearchHistory(CUSTOMER);
      expect(res).toEqual({ status: 'cleared', count: 7 });
    });
  });
});
