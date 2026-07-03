import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('CartService', () => {
  let service: CartService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };

  const CUSTOMER = 'cust-1';
  const IDENTITY = { customerId: CUSTOMER };
  const CART = { id: 'cart-1', shopId: 'shop-1', customerId: CUSTOMER };

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue('shop-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
      ],
    }).compile();

    service = module.get(CartService);
    // Default: getOrCreateCart resolves to a stable cart.
    prisma.cart.upsert.mockResolvedValue(CART);
  });

  describe('getCart', () => {
    it('returns items with computed subtotal and itemCount', async () => {
      prisma.cartItem.findMany.mockResolvedValue([
        { id: 'i1', quantity: 2, variant: { price: 100 } },
        { id: 'i2', quantity: 1, variant: { price: 50 } },
      ]);

      const res = await service.getCart(IDENTITY);

      expect(prisma.cart.upsert).toHaveBeenCalledWith({
        where: { shopId_customerId: { shopId: 'shop-1', customerId: CUSTOMER } },
        create: { shopId: 'shop-1', customerId: CUSTOMER },
        update: {},
      });
      expect(res.data.id).toBe('cart-1');
      expect(res.data.subtotal).toBe(250);
      expect(res.data.itemCount).toBe(3);
    });

    it('returns an empty cart (subtotal 0) when there are no items', async () => {
      prisma.cartItem.findMany.mockResolvedValue([]);
      const res = await service.getCart(IDENTITY);
      expect(res.data.subtotal).toBe(0);
      expect(res.data.itemCount).toBe(0);
    });
  });

  describe('getShopId guard', () => {
    it('throws BadRequest when the shop context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(
        service.addItem(IDENTITY, { variantId: 'v1', quantity: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('addItem', () => {
    it('rejects a non-integer quantity', async () => {
      await expect(
        service.addItem(IDENTITY, { variantId: 'v1', quantity: 1.5 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.variant.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a quantity below 1', async () => {
      await expect(
        service.addItem(IDENTITY, { variantId: 'v1', quantity: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when the variant is missing or not a published product', async () => {
      prisma.variant.findFirst.mockResolvedValue(null);
      await expect(
        service.addItem(IDENTITY, { variantId: 'v1', quantity: 1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      // Only PUBLISHED products are buyable (CART-1).
      expect(prisma.variant.findFirst).toHaveBeenCalledWith({
        where: { id: 'v1', shopId: 'shop-1', product: { status: 'PUBLISHED' } },
      });
    });

    it('upserts the cart item, incrementing quantity on conflict', async () => {
      prisma.variant.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop-1' });
      prisma.cartItem.upsert.mockResolvedValue({ id: 'item-1', quantity: 3 });

      const res = await service.addItem(IDENTITY, { variantId: 'v1', quantity: 3 });

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { cartId_variantId: { cartId: 'cart-1', variantId: 'v1' } },
        create: { cartId: 'cart-1', variantId: 'v1', quantity: 3 },
        update: { quantity: { increment: 3 } },
      });
      expect(res).toEqual({ status: 'added', item: { id: 'item-1', quantity: 3 } });
    });
  });

  describe('updateItem', () => {
    it('rejects a negative quantity', async () => {
      await expect(
        service.updateItem(IDENTITY, 'item-1', { quantity: -1 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when the item is not in the customer cart', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);
      await expect(
        service.updateItem(IDENTITY, 'item-x', { quantity: 2 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes the item when quantity is 0', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: 'item-1' });
      const res = await service.updateItem(IDENTITY, 'item-1', { quantity: 0 });
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
      expect(res).toEqual({ status: 'removed', itemId: 'item-1' });
    });

    it('updates the quantity when positive', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: 'item-1' });
      prisma.cartItem.update.mockResolvedValue({ id: 'item-1', quantity: 5 });
      const res = await service.updateItem(IDENTITY, 'item-1', { quantity: 5 });
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
      expect(res).toEqual({ status: 'updated', item: { id: 'item-1', quantity: 5 } });
    });
  });

  describe('removeItem', () => {
    it('throws NotFound when nothing was deleted', async () => {
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.removeItem(IDENTITY, 'item-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('removes the item scoped to the customer cart', async () => {
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      const res = await service.removeItem(IDENTITY, 'item-1');
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { id: 'item-1', cartId: 'cart-1' },
      });
      expect(res).toEqual({ status: 'removed', itemId: 'item-1' });
    });
  });

  describe('clearCart', () => {
    it('deletes all items and reports the count', async () => {
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 4 });
      const res = await service.clearCart(IDENTITY);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(res).toEqual({ status: 'cleared', count: 4 });
    });
  });

  describe('guest identity', () => {
    it('resolves a guest cart by (shopId, guestToken)', async () => {
      prisma.cartItem.findMany.mockResolvedValue([]);
      await service.getCart({ guestToken: 'g-1' });
      expect(prisma.cart.upsert).toHaveBeenCalledWith({
        where: { shopId_guestToken: { shopId: 'shop-1', guestToken: 'g-1' } },
        create: { shopId: 'shop-1', guestToken: 'g-1' },
        update: {},
      });
    });

    it('throws BadRequest when neither customerId nor guestToken is provided', async () => {
      await expect(service.getCart({})).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('mergeGuestCart', () => {
    it('returns noop for an empty guestToken without touching the DB', async () => {
      const res = await service.mergeGuestCart(CUSTOMER, '');
      expect(res).toEqual({ status: 'noop', merged: 0 });
      expect(prisma.cart.findUnique).not.toHaveBeenCalled();
    });

    it('is a no-op when the guest has no cart', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      const res = await service.mergeGuestCart(CUSTOMER, 'g-1');
      expect(res).toEqual({ status: 'noop', merged: 0 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('merges guest items into the customer cart then deletes the guest cart', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: 'guest-cart',
        items: [
          { variantId: 'v1', quantity: 2 },
          { variantId: 'v2', quantity: 1 },
        ],
      });
      const res = await service.mergeGuestCart(CUSTOMER, 'g-1');

      // customer cart resolved via the default upsert mock (cart-1)
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { cartId_variantId: { cartId: 'cart-1', variantId: 'v1' } },
        create: { cartId: 'cart-1', variantId: 'v1', quantity: 2 },
        update: { quantity: { increment: 2 } },
      });
      expect(prisma.cart.delete).toHaveBeenCalledWith({ where: { id: 'guest-cart' } });
      expect(res).toEqual({ status: 'merged', merged: 2 });
    });
  });
});
