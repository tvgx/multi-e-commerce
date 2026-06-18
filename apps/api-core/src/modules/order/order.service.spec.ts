import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { OrderService } from './order.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { WalletService, WALLET_PAYMENT_TYPE } from '../wallet/wallet.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

// QR rendering is pure CPU work the service does after commit — stub it so the
// spec stays deterministic and doesn't depend on the qrcode package internals.
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QR'),
}));

describe('OrderService', () => {
  let service: OrderService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let inventory: { decrementStock: jest.Mock; restoreStock: jest.Mock };
  let gateway: { notifyUser: jest.Mock };
  let email: { sendOrderConfirmation: jest.Mock; sendOrderShipped: jest.Mock };
  let wallet: { getOrCreate: jest.Mock; debit: jest.Mock; credit: jest.Mock };
  let timeoutQueue: { add: jest.Mock };

  const SHOP = 'shop-1';
  const CUSTOMER = 'cust-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    inventory = {
      decrementStock: jest.fn().mockResolvedValue(undefined),
      restoreStock: jest.fn().mockResolvedValue(undefined),
    };
    gateway = { notifyUser: jest.fn().mockResolvedValue(undefined) };
    email = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
      sendOrderShipped: jest.fn().mockResolvedValue(undefined),
    };
    wallet = {
      getOrCreate: jest.fn().mockResolvedValue({ id: 'w1' }),
      debit: jest.fn().mockResolvedValue(undefined),
      credit: jest.fn().mockResolvedValue(undefined),
    };
    timeoutQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: InventoryService, useValue: inventory },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: EmailService, useValue: email },
        { provide: WalletService, useValue: wallet },
        { provide: getQueueToken('payment-timeout'), useValue: timeoutQueue },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  /** Wire the prisma mock for a minimal successful createOrder of one variant. */
  function arrangeCheckout(
    paymentMethod: { id: string; type: string },
    variant = { id: 'v1', price: 1000, shopId: SHOP },
  ) {
    prisma.variant.findMany.mockResolvedValue([variant]);
    prisma.paymentMethod.findFirst.mockResolvedValue(paymentMethod);
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      number: 'ORD-1',
      lineItems: [],
    });
    prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
    prisma.customer.findUnique.mockResolvedValue({ email: 'buyer@test.dev' });
  }

  describe('getShopId guard', () => {
    it('throws BadRequest when tenant context is missing', async () => {
      tenant.getTenantId.mockReturnValue(undefined);
      await expect(
        service.findOneOrder('o1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createOrder', () => {
    it('rejects when no lineItems are given and the cart is empty', async () => {
      prisma.cart.findUnique.mockResolvedValue({ id: 'c1', items: [] });
      await expect(
        service.createOrder(CUSTOMER, { paymentMethodId: 'pm1' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falls back to the server-side cart and clears it on checkout', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: 'cart-9',
        items: [{ variantId: 'v1', quantity: 2 }],
      });
      arrangeCheckout({ id: 'pm1', type: 'COD' });

      await service.createOrder(CUSTOMER, { paymentMethodId: 'pm1' } as any);

      expect(inventory.decrementStock).toHaveBeenCalledWith(
        [{ variantId: 'v1', quantity: 2 }],
        expect.any(String),
        prisma,
      );
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-9' },
      });
    });

    it('rejects when a variant is not found in this shop', async () => {
      prisma.variant.findMany.mockResolvedValue([]); // requested 1, found 0
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'pm1',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a pending bank-transfer order with subtotal pricing and a QR code', async () => {
      arrangeCheckout({ id: 'pm-bt', type: 'BankTransfer' });

      const res = await service.createOrder(CUSTOMER, {
        paymentMethodId: 'pm-bt',
        lineItems: [{ variantId: 'v1', quantity: 2 }],
      } as any);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 2000,
            itemTotal: 2000,
            state: 'checkout',
            paymentState: 'balance_due',
          }),
        }),
      );
      expect(prisma.paymentConfirmToken.create).toHaveBeenCalled();
      // PAY-2: bank-transfer orders schedule a timeout that auto-cancels + restocks
      expect(timeoutQueue.add).toHaveBeenCalledWith(
        'check-payment-status',
        { orderId: expect.any(String) },
        expect.objectContaining({ delay: expect.any(Number) }),
      );
      expect(res.qrCodeUrl).toBe('data:image/png;base64,QR');
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'ORDER_CREATED',
        expect.any(String),
        expect.any(String),
        { orderId: 'order-1' },
      );
      expect(email.sendOrderConfirmation).toHaveBeenCalledWith(
        'buyer@test.dev',
        expect.objectContaining({ id: 'order-1' }),
      );
    });

    it('marks a wallet-paid order confirmed/paid and debits the wallet', async () => {
      arrangeCheckout({ id: 'pm-w', type: WALLET_PAYMENT_TYPE });

      await service.createOrder(CUSTOMER, {
        paymentMethodId: 'pm-w',
        lineItems: [{ variantId: 'v1', quantity: 1 }],
      } as any);

      expect(wallet.getOrCreate).toHaveBeenCalledWith(CUSTOMER, SHOP, prisma);
      expect(wallet.debit).toHaveBeenCalledWith(
        prisma,
        'w1',
        SHOP,
        1000,
        'payment',
        expect.objectContaining({ orderId: expect.any(String), createdBy: 'customer' }),
      );
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: 'confirmed', paymentState: 'paid' }),
        }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: 'completed' }),
        }),
      );
    });

    it('applies a percentage promotion and increments its usage', async () => {
      arrangeCheckout({ id: 'pm1', type: 'COD' });
      prisma.promotion.findFirst.mockResolvedValue({
        id: 'promo-1',
        code: 'SAVE10',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
        usedCount: 0,
        usageLimit: null,
        startsAt: null,
        expiresAt: null,
      });

      await service.createOrder(CUSTOMER, {
        paymentMethodId: 'pm1',
        promotionCode: 'SAVE10',
        lineItems: [{ variantId: 'v1', quantity: 2 }], // subtotal 2000
      } as any);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemTotal: 2000,
            promoTotal: 200,
            totalAmount: 1800,
          }),
        }),
      );
      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { usedCount: { increment: 1 } },
      });
      expect(prisma.promotionUsage.create).toHaveBeenCalled();
    });

    it('rejects an expired promotion code', async () => {
      prisma.variant.findMany.mockResolvedValue([{ id: 'v1', price: 1000 }]);
      prisma.promotion.findFirst.mockResolvedValue({
        id: 'promo-1',
        isActive: true,
        expiresAt: new Date('2000-01-01'),
        discountType: 'fixed',
        discountValue: 100,
      });
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'pm1',
          promotionCode: 'OLD',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a promotion whose usage limit is reached', async () => {
      prisma.variant.findMany.mockResolvedValue([{ id: 'v1', price: 1000 }]);
      prisma.promotion.findFirst.mockResolvedValue({
        id: 'promo-1',
        isActive: true,
        usageLimit: 5,
        usedCount: 5,
        discountType: 'fixed',
        discountValue: 100,
      });
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'pm1',
          promotionCode: 'MAX',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('adds the shipping fee for a valid shipping method', async () => {
      arrangeCheckout({ id: 'pm1', type: 'COD' });
      prisma.shippingMethod.findFirst.mockResolvedValue({
        id: 'sm1',
        baseFee: 500,
        freeThreshold: null,
      });

      await service.createOrder(CUSTOMER, {
        paymentMethodId: 'pm1',
        shippingMethodId: 'sm1',
        lineItems: [{ variantId: 'v1', quantity: 1 }], // subtotal 1000
      } as any);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shipmentTotal: 500, totalAmount: 1500 }),
        }),
      );
    });

    it('rejects an invalid shipping method', async () => {
      prisma.variant.findMany.mockResolvedValue([{ id: 'v1', price: 1000 }]);
      prisma.shippingMethod.findFirst.mockResolvedValue(null);
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'pm1',
          shippingMethodId: 'bad',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when a saved shipping address is not found', async () => {
      prisma.variant.findMany.mockResolvedValue([{ id: 'v1', price: 1000 }]);
      prisma.customerAddress.findFirst.mockResolvedValue(null);
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'pm1',
          shippingAddressId: 'addr-x',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an invalid payment method', async () => {
      prisma.variant.findMany.mockResolvedValue([{ id: 'v1', price: 1000 }]);
      prisma.paymentMethod.findFirst.mockResolvedValue(null);
      await expect(
        service.createOrder(CUSTOMER, {
          paymentMethodId: 'bad',
          lineItems: [{ variantId: 'v1', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAllOrders', () => {
    it('paginates with shop scope and returns meta', async () => {
      prisma.order.findMany.mockResolvedValue([{ id: 'o1' }]);
      prisma.order.count.mockResolvedValue(1);

      const res = await service.findAllOrders({} as any);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP }, skip: 0, take: 20 }),
      );
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('applies state/paymentState/customerId filters', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAllOrders({
        state: 'confirmed',
        paymentState: 'paid',
        customerId: CUSTOMER,
      } as any);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            shopId: SHOP,
            state: 'confirmed',
            paymentState: 'paid',
            customerId: CUSTOMER,
          },
        }),
      );
    });
  });

  describe('findOneOrder', () => {
    it('throws NotFound when the order is not in this shop', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.findOneOrder('o-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the order when found', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'o1' });
      await expect(service.findOneOrder('o1')).resolves.toEqual({ id: 'o1' });
    });
  });

  describe('updateOrderStatus', () => {
    it('rejects an illegal state transition', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        state: 'delivered',
        customerId: CUSTOMER,
        number: 'ORD-1',
      });
      await expect(
        service.updateOrderStatus('o1', { status: 'processing' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions to shipped, syncs the shipment, and emails the customer', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        state: 'processing',
        customerId: CUSTOMER,
        number: 'ORD-1',
        customer: { email: 'buyer@test.dev' },
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', state: 'shipped' });

      await service.updateOrderStatus('o1', { status: 'shipped' } as any);

      expect(prisma.shipment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'o1', shopId: SHOP, state: { in: ['pending', 'ready'] } },
        data: { state: 'shipped', shippedAt: expect.any(Date) },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1', shopId: SHOP },
        data: { state: 'shipped', shipmentState: 'shipped' },
      });
      expect(email.sendOrderShipped).toHaveBeenCalledWith(
        'buyer@test.dev',
        expect.any(Object),
      );
    });

    it('canceled: voids the order — restocks and refunds a paid order (ORD-1)', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        state: 'confirmed',
        paymentState: 'paid',
        customerId: CUSTOMER,
        totalAmount: 2000,
        shopId: SHOP,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', state: 'canceled' });

      await service.updateOrderStatus('o1', { status: 'canceled' } as any);

      expect(inventory.restoreStock).toHaveBeenCalledWith('o1', prisma);
      expect(wallet.credit).toHaveBeenCalledWith(
        prisma,
        'w1',
        SHOP,
        2000,
        'refund',
        expect.objectContaining({ orderId: 'o1', createdBy: 'admin' }),
      );
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'ORDER_REFUNDED',
        expect.any(String),
        expect.any(String),
        { orderId: 'o1' },
      );
    });
  });

  describe('cancelOrder', () => {
    it('throws NotFound when the order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.cancelOrder('o-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects when a customer cancels an order that is not theirs', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        state: 'confirmed',
        customerId: 'someone-else',
      });
      await expect(service.cancelOrder('o1', CUSTOMER)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects cancellation of a shipped order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        state: 'shipped',
        customerId: CUSTOMER,
      });
      await expect(service.cancelOrder('o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('cancels an unpaid order, restores stock, and does not refund', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        state: 'confirmed',
        paymentState: 'balance_due',
        customerId: CUSTOMER,
        totalAmount: 1000,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', state: 'canceled' });

      await service.cancelOrder('o1');

      expect(inventory.restoreStock).toHaveBeenCalledWith('o1', prisma);
      expect(wallet.credit).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { state: 'canceled' },
      });
    });

    it('refunds a paid order to the wallet and notifies the customer', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        state: 'confirmed',
        paymentState: 'paid',
        customerId: CUSTOMER,
        totalAmount: 2000,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', state: 'canceled' });

      await service.cancelOrder('o1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { state: 'canceled', paymentState: 'refunded' },
      });
      expect(wallet.credit).toHaveBeenCalledWith(
        prisma,
        'w1',
        SHOP,
        2000,
        'refund',
        expect.objectContaining({ orderId: 'o1', createdBy: 'system' }),
      );
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'ORDER_REFUNDED',
        expect.any(String),
        expect.any(String),
        { orderId: 'o1' },
      );
    });
  });

  describe('refundOrder', () => {
    it('rejects an already-refunded order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        paymentState: 'refunded',
        customerId: CUSTOMER,
      });
      await expect(service.refundOrder('o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refunds a paid order: flips payment rows, credits the wallet, notifies', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        paymentState: 'paid',
        customerId: CUSTOMER,
        totalAmount: 2000,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', paymentState: 'refunded' });

      await service.refundOrder('o1');

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'o1', state: 'completed' },
        data: { state: 'refunded' },
      });
      expect(wallet.credit).toHaveBeenCalledWith(
        prisma,
        'w1',
        SHOP,
        2000,
        'refund',
        expect.objectContaining({ orderId: 'o1', createdBy: 'admin' }),
      );
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'ORDER_REFUNDED',
        expect.any(String),
        expect.any(String),
        { orderId: 'o1' },
      );
    });

    it('restores stock when refunding an undelivered order (ORD-2)', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        state: 'confirmed',
        paymentState: 'paid',
        customerId: CUSTOMER,
        totalAmount: 2000,
        shopId: SHOP,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', paymentState: 'refunded' });

      await service.refundOrder('o1');

      expect(inventory.restoreStock).toHaveBeenCalledWith('o1', prisma);
    });

    it('does NOT restock when refunding a delivered order (goods already shipped)', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        state: 'delivered',
        paymentState: 'paid',
        customerId: CUSTOMER,
        totalAmount: 2000,
        shopId: SHOP,
      });
      prisma.order.update.mockResolvedValue({ id: 'o1', paymentState: 'refunded' });

      await service.refundOrder('o1');

      expect(inventory.restoreStock).not.toHaveBeenCalled();
    });
  });
});
