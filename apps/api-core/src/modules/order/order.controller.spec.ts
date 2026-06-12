import { UnauthorizedException } from '@nestjs/common';
import { OrderController } from './order.controller';

describe('OrderController', () => {
  let controller: OrderController;
  let service: Record<string, jest.Mock>;

  beforeEach(() => {
    service = {
      createOrder: jest.fn().mockResolvedValue({ id: 'o1' }),
      findAllOrders: jest.fn().mockResolvedValue({ data: [] }),
      findOneOrder: jest.fn().mockResolvedValue({ id: 'o1' }),
      updateOrderStatus: jest.fn().mockResolvedValue({ id: 'o1' }),
      cancelOrder: jest.fn().mockResolvedValue({ id: 'o1' }),
      refundOrder: jest.fn().mockResolvedValue({ id: 'o1' }),
    };
    controller = new OrderController(service as any);
  });

  describe('create (checkout)', () => {
    it('rejects an unauthenticated request', () => {
      expect(() => controller.create({ user: undefined }, {} as any)).toThrow(
        UnauthorizedException,
      );
    });

    it('passes the authenticated customer id to the service', () => {
      const dto = { paymentMethodId: 'pm1' } as any;
      controller.create({ user: { id: 'cust-1' } }, dto);
      expect(service.createOrder).toHaveBeenCalledWith('cust-1', dto);
    });
  });

  describe('findMyOrders', () => {
    it('rejects an unauthenticated request', () => {
      expect(() => controller.findMyOrders({ user: undefined }, {} as any)).toThrow(
        UnauthorizedException,
      );
    });

    it('scopes the query to the authenticated customer', () => {
      controller.findMyOrders({ user: { id: 'cust-1' } }, { state: 'confirmed' } as any);
      expect(service.findAllOrders).toHaveBeenCalledWith({
        state: 'confirmed',
        customerId: 'cust-1',
      });
    });
  });

  describe('cancelMyOrder', () => {
    it('rejects an unauthenticated request', () => {
      expect(() => controller.cancelMyOrder({ user: undefined }, 'o1')).toThrow(
        UnauthorizedException,
      );
    });

    it('passes the customer id so the service can authorize ownership', () => {
      controller.cancelMyOrder({ user: { id: 'cust-1' } }, 'o1');
      expect(service.cancelOrder).toHaveBeenCalledWith('o1', 'cust-1');
    });
  });

  describe('admin endpoints', () => {
    it('findAll / findOne / updateStatus / refund delegate to the service', () => {
      controller.findAll({ page: 1 } as any);
      controller.findOne('o1');
      controller.updateStatus('o1', { status: 'shipped' } as any);
      controller.refund('o1');
      expect(service.findAllOrders).toHaveBeenCalledWith({ page: 1 });
      expect(service.findOneOrder).toHaveBeenCalledWith('o1');
      expect(service.updateOrderStatus).toHaveBeenCalledWith('o1', { status: 'shipped' });
      expect(service.refundOrder).toHaveBeenCalledWith('o1');
    });
  });
});
