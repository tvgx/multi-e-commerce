import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { OrderService } from '../order/order.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('ShippingService', () => {
  let service: ShippingService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let gateway: { notifyUser: jest.Mock };
  let email: { sendOrderShipped: jest.Mock };
  let orderService: { voidOrder: jest.Mock };

  const SHOP = 'shop-1';
  const CUSTOMER = 'cust-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    gateway = { notifyUser: jest.fn().mockResolvedValue(undefined) };
    email = { sendOrderShipped: jest.fn().mockResolvedValue(undefined) };
    orderService = { voidOrder: jest.fn().mockResolvedValue({ order: {}, refunded: false }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: EmailService, useValue: email },
        { provide: OrderService, useValue: orderService },
      ],
    }).compile();

    service = module.get(ShippingService);
  });

  describe('computeFee (static)', () => {
    it('is free once the subtotal reaches the freeThreshold', () => {
      expect(ShippingService.computeFee({ baseFee: 300, freeThreshold: 1000 }, 1000)).toBe(0);
    });
    it('charges the base fee below the threshold', () => {
      expect(ShippingService.computeFee({ baseFee: 300, freeThreshold: 1000 }, 999)).toBe(300);
    });
    it('charges the base fee when there is no threshold', () => {
      expect(ShippingService.computeFee({ baseFee: 300, freeThreshold: null }, 999999)).toBe(300);
    });
  });

  describe('quote', () => {
    it('throws NotFound for an unknown method', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue(null);
      await expect(
        service.quote({ shippingMethodId: 'x', subtotal: 500 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the computed fee for a valid method', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue({
        id: 'sm1',
        baseFee: 300,
        freeThreshold: 1000,
        estimatedDays: 3,
      });
      const res = await service.quote({ shippingMethodId: 'sm1', subtotal: 500 } as any);
      expect(res).toEqual({
        shippingMethodId: 'sm1',
        fee: 300,
        freeThreshold: 1000,
        estimatedDays: 3,
      });
    });
  });

  describe('createMethod', () => {
    it('defaults active=true and position=0', async () => {
      prisma.shippingMethod.create.mockResolvedValue({ id: 'sm1' });
      await service.createMethod({ name: 'Std', baseFee: 300 } as any);
      expect(prisma.shippingMethod.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ shopId: SHOP, active: true, position: 0 }),
      });
    });
  });

  describe('updateMethod', () => {
    it('throws NotFound when the method is not in this shop', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue(null);
      await expect(
        service.updateMethod('sm1', { name: 'X' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteMethod', () => {
    it('throws NotFound when the method is not in this shop', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue(null);
      await expect(service.deleteMethod('sm1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('soft-disables a method still referenced by orders', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue({ id: 'sm1' });
      prisma.order.count.mockResolvedValue(3);
      await service.deleteMethod('sm1');
      expect(prisma.shippingMethod.update).toHaveBeenCalledWith({
        where: { id: 'sm1' },
        data: { active: false },
      });
      expect(prisma.shippingMethod.delete).not.toHaveBeenCalled();
    });

    it('hard-deletes a method with no orders', async () => {
      prisma.shippingMethod.findFirst.mockResolvedValue({ id: 'sm1' });
      prisma.order.count.mockResolvedValue(0);
      await service.deleteMethod('sm1');
      expect(prisma.shippingMethod.delete).toHaveBeenCalledWith({ where: { id: 'sm1' } });
    });
  });

  describe('findShipments', () => {
    it('paginates with shop scope and returns meta', async () => {
      prisma.shipment.findMany.mockResolvedValue([{ id: 's1' }]);
      prisma.shipment.count.mockResolvedValue(1);
      const res = await service.findShipments({});
      expect(prisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP }, skip: 0, take: 20 }),
      );
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('updateShipment', () => {
    it('throws NotFound when the shipment is not in this shop', async () => {
      prisma.shipment.findFirst.mockResolvedValue(null);
      await expect(
        service.updateShipment('sh1', { state: 'shipped' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an illegal shipment transition', async () => {
      prisma.shipment.findFirst.mockResolvedValue({
        id: 'sh1',
        state: 'delivered',
        orderId: 'o1',
        order: { state: 'delivered' },
      });
      await expect(
        service.updateShipment('sh1', { state: 'pending' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ships a shipment: timestamps, syncs the order, notifies and emails', async () => {
      prisma.shipment.findFirst.mockResolvedValue({
        id: 'sh1',
        state: 'pending',
        orderId: 'o1',
        trackingNumber: null,
        order: { id: 'o1', number: 'ORD-1', state: 'confirmed', customerId: CUSTOMER },
      });
      prisma.shipment.update.mockResolvedValue({ id: 'sh1', state: 'shipped' });
      prisma.customer.findUnique.mockResolvedValue({ email: 'buyer@test.dev' });

      await service.updateShipment('sh1', { state: 'shipped', trackingNumber: 'TRK1' } as any);

      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 'sh1' },
        data: expect.objectContaining({ state: 'shipped', shippedAt: expect.any(Date) }),
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { shipmentState: 'shipped', state: 'shipped' },
      });
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'SHIPMENT_UPDATED',
        'Order Shipped',
        expect.stringContaining('TRK1'),
        expect.objectContaining({ orderId: 'o1', shipmentId: 'sh1', state: 'shipped' }),
      );
      expect(email.sendOrderShipped).toHaveBeenCalledWith('buyer@test.dev', expect.any(Object));
    });

    it('SHIP-1: a returned shipment voids the order (restock + refund) and notifies', async () => {
      prisma.shipment.findFirst.mockResolvedValue({
        id: 'sh1',
        state: 'delivered',
        orderId: 'o1',
        order: {
          id: 'o1', number: 'ORD-1', state: 'delivered', customerId: CUSTOMER,
          totalAmount: 250000, paymentState: 'paid', shopId: SHOP,
        },
      });
      prisma.shipment.update.mockResolvedValue({ id: 'sh1', state: 'returned' });
      orderService.voidOrder.mockResolvedValue({ order: {}, refunded: true });

      await service.updateShipment('sh1', { state: 'returned' } as any);

      expect(orderService.voidOrder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'o1', paymentState: 'paid' }),
        expect.objectContaining({ nextState: 'returned', restock: true, refund: true }),
      );
      // shipmentState synced, order.state left to voidOrder
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { shipmentState: 'returned' },
      });
      // refund notification fired
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP, CUSTOMER, 'CUSTOMER', 'ORDER_REFUNDED',
        'Order Refunded', expect.stringContaining('order ORD-1'),
        expect.objectContaining({ orderId: 'o1' }),
      );
    });
  });

  describe('trackOrder', () => {
    it('throws NotFound when the order is not the buyer’s', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.trackOrder('o1', CUSTOMER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the order with its shipments', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'o1', number: 'ORD-1' });
      prisma.shipment.findMany.mockResolvedValue([{ id: 'sh1' }]);
      const res = await service.trackOrder('o1', CUSTOMER);
      expect(res).toEqual({ order: { id: 'o1', number: 'ORD-1' }, shipments: [{ id: 'sh1' }] });
    });
  });
});
