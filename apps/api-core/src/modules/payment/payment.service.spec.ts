import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { OrderService } from '../order/order.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let queue: { add: jest.Mock };
  let gateway: { notifyUser: jest.Mock };
  let email: { sendPaymentConfirmed: jest.Mock };
  let orderService: { voidOrder: jest.Mock };

  const SHOP = 'shop-1';
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 60 * 1000);

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    gateway = { notifyUser: jest.fn().mockResolvedValue(undefined) };
    email = { sendPaymentConfirmed: jest.fn().mockResolvedValue(undefined) };
    orderService = { voidOrder: jest.fn().mockResolvedValue({ order: {}, refunded: false }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: getQueueToken('payment-timeout'), useValue: queue },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: EmailService, useValue: email },
        { provide: OrderService, useValue: orderService },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  describe('createPaymentUrl', () => {
    it('throws NotFound for an unknown order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(
        service.createPaymentUrl({ orderId: 'o1', amount: 1000 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns a checkout url for a valid order', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'o1' });
      const res = await service.createPaymentUrl({ orderId: 'o1', amount: 1000 } as any);
      expect(res.checkoutUrl).toContain('o1');
    });
  });

  describe('confirmPayment', () => {
    it('rejects an unknown token', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment('t', 'confirm')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an already-used token', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue({
        id: 'ct1',
        usedAt: new Date(),
        expiresAt: future,
      });
      await expect(service.confirmPayment('t', 'confirm')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an expired token', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue({
        id: 'ct1',
        usedAt: null,
        expiresAt: past,
      });
      await expect(service.confirmPayment('t', 'confirm')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('confirm: completes the payment, pays the order, notifies and emails', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue({
        id: 'ct1',
        usedAt: null,
        expiresAt: future,
        paymentId: 'pay1',
        orderId: 'o1',
      });
      prisma.payment.findUnique.mockResolvedValue({ id: 'pay1' });
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        number: 'ORD-1',
        shopId: SHOP,
        customerId: 'cust-1',
      });
      prisma.customer.findUnique.mockResolvedValue({ email: 'buyer@test.dev' });

      const res = await service.confirmPayment('t', 'confirm');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay1' },
        data: { state: 'completed' },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { state: 'confirmed', paymentState: 'paid' },
      });
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        'cust-1',
        'CUSTOMER',
        'PAYMENT_CONFIRMED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ orderId: 'o1', paymentId: 'pay1' }),
      );
      expect(email.sendPaymentConfirmed).toHaveBeenCalled();
      expect(res).toEqual({ success: true, action: 'confirm' });
    });

    it('reject: voids the order (restock + fail payments) and notifies', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue({
        id: 'ct1',
        usedAt: null,
        expiresAt: future,
        paymentId: 'pay1',
        orderId: 'o1',
      });
      prisma.payment.findUnique.mockResolvedValue({ id: 'pay1' });
      const order = {
        id: 'o1',
        number: 'ORD-1',
        shopId: SHOP,
        customerId: 'cust-1',
      };
      prisma.order.findUnique.mockResolvedValue(order);

      const res = await service.confirmPayment('t', 'reject');

      // PAY-1: rejection must restore stock — delegated to the shared voidOrder
      expect(orderService.voidOrder).toHaveBeenCalledWith(
        prisma,
        order,
        expect.objectContaining({ restock: true, failPayments: true }),
      );
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        'cust-1',
        'CUSTOMER',
        'PAYMENT_REJECTED',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ orderId: 'o1', paymentId: 'pay1' }),
      );
      expect(email.sendPaymentConfirmed).not.toHaveBeenCalled();
      expect(res.action).toBe('reject');
    });
  });

  describe('getPaymentStatus', () => {
    it('throws NotFound when no payment exists for the order', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      await expect(service.getPaymentStatus('o1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns payment and order states', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        state: 'completed',
        order: { state: 'confirmed' },
      });
      const res = await service.getPaymentStatus('o1');
      expect(res).toEqual({ paymentState: 'completed', orderState: 'confirmed' });
    });
  });

  describe('schedulePaymentTimeout', () => {
    it('enqueues a delayed check-payment-status job', async () => {
      await service.schedulePaymentTimeout('o1', 1000);
      expect(queue.add).toHaveBeenCalledWith(
        'check-payment-status',
        { orderId: 'o1' },
        { delay: 1000 },
      );
    });
  });

  describe('getTokenInfo', () => {
    it('throws NotFound for an unknown token', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue(null);
      await expect(service.getTokenInfo('t')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns order/payment info for a valid token', async () => {
      prisma.paymentConfirmToken.findUnique.mockResolvedValue({
        id: 'ct1',
        usedAt: null,
        expiresAt: future,
        orderId: 'o1',
        paymentId: 'pay1',
      });
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        shop: { name: 'My Shop', domain: 'myshop.dev' },
      });
      prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', amount: 5000 });

      const res = await service.getTokenInfo('t');
      expect(res).toMatchObject({
        orderId: 'o1',
        amount: 5000,
        shopName: 'My Shop',
        shopDomain: 'myshop.dev',
      });
    });
  });
});
