import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService, WALLET_PAYMENT_TYPE } from './wallet.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: MockPrisma;
  let tenant: { getTenantId: jest.Mock };
  let gateway: { notifyUser: jest.Mock };

  const CUSTOMER = 'cust-1';
  const SHOP = 'shop-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    tenant = { getTenantId: jest.fn().mockReturnValue(SHOP) };
    gateway = { notifyUser: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenant },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(WalletService);
  });

  describe('credit', () => {
    it('rejects a non-positive amount', async () => {
      await expect(
        service.credit(prisma, 'w1', SHOP, 0, 'deposit'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('increments the balance and records the transaction with balanceAfter', async () => {
      prisma.wallet.update.mockResolvedValue({ id: 'w1', balance: 5000 });
      await service.credit(prisma, 'w1', SHOP, 5000, 'deposit', {
        orderId: 'o1',
        note: 'n',
        createdBy: 'admin',
      });
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'w1' },
        data: { balance: { increment: 5000 } },
      });
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walletId: 'w1',
          shopId: SHOP,
          type: 'deposit',
          amount: 5000,
          balanceAfter: 5000,
          orderId: 'o1',
          createdBy: 'admin',
        }),
      });
    });

    it('defaults createdBy to "system"', async () => {
      prisma.wallet.update.mockResolvedValue({ id: 'w1', balance: 100 });
      await service.credit(prisma, 'w1', SHOP, 100, 'refund');
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ createdBy: 'system' }),
      });
    });
  });

  describe('debit', () => {
    it('rejects a non-positive amount', async () => {
      await expect(
        service.debit(prisma, 'w1', SHOP, -5, 'payment'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws Insufficient balance when the guarded updateMany matches nothing', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.debit(prisma, 'w1', SHOP, 5000, 'payment'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('decrements with a balance guard and records a negative-amount transaction', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUniqueOrThrow.mockResolvedValue({ id: 'w1', balance: 1000 });
      await service.debit(prisma, 'w1', SHOP, 4000, 'payment', { orderId: 'o9' });
      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', balance: { gte: 4000 } },
        data: { balance: { decrement: 4000 } },
      });
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -4000,
          balanceAfter: 1000,
          type: 'payment',
          orderId: 'o9',
        }),
      });
    });
  });

  describe('getMyWallet', () => {
    it('returns the wallet with non-expired pending topups and never selects the token', async () => {
      prisma.wallet.upsert.mockResolvedValue({ id: 'w1', balance: 0 });
      prisma.walletTopupRequest.findMany.mockResolvedValue([{ id: 't1', amount: 2000 }]);

      const res = await service.getMyWallet(CUSTOMER);

      const call = prisma.walletTopupRequest.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({ walletId: 'w1', status: 'pending' });
      expect(call.where.expiresAt.gt).toBeInstanceOf(Date);
      expect(call.select.token).toBeUndefined();
      expect(res.pendingTopups).toEqual([{ id: 't1', amount: 2000 }]);
    });
  });

  describe('requestTopup', () => {
    it.each([undefined, NaN, Infinity, 999, 'x'])(
      'rejects an invalid amount: %s',
      async (amount) => {
        await expect(
          service.requestTopup(CUSTOMER, { amount } as any),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it('creates a topup and strips the token from the response', async () => {
      prisma.wallet.upsert.mockResolvedValue({ id: 'w1' });
      prisma.walletTopupRequest.create.mockResolvedValue({
        id: 't1',
        amount: 5000,
        token: 'secret-token',
        status: 'pending',
      });
      prisma.shopBankAccount.findUnique.mockResolvedValue({ bankName: 'VCB' });

      const res = await service.requestTopup(CUSTOMER, { amount: 5000 });

      const createArg = prisma.walletTopupRequest.create.mock.calls[0][0];
      expect(createArg.data).toMatchObject({ walletId: 'w1', shopId: SHOP, amount: 5000 });
      expect(typeof createArg.data.token).toBe('string');
      expect(res).not.toHaveProperty('token');
      expect(res.bankAccount).toEqual({ bankName: 'VCB' });
    });
  });

  describe('resolveTopupById', () => {
    it('throws NotFound when the topup is not in this shop', async () => {
      prisma.walletTopupRequest.findFirst.mockResolvedValue(null);
      await expect(
        service.resolveTopupById('t1', 'confirm'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('confirm: credits the wallet, marks confirmed, and notifies the customer', async () => {
      prisma.walletTopupRequest.findFirst.mockResolvedValue({ id: 't1', shopId: SHOP });
      prisma.walletTopupRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.walletTopupRequest.findUniqueOrThrow.mockResolvedValue({
        id: 't1',
        walletId: 'w1',
        amount: 5000,
        customerId: CUSTOMER,
      });
      prisma.wallet.update.mockResolvedValue({ id: 'w1', balance: 5000 });

      const res = await service.resolveTopupById('t1', 'confirm');

      expect(prisma.walletTopupRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'confirmed' }),
        }),
      );
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'w1' },
        data: { balance: { increment: 5000 } },
      });
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'WALLET_TOPUP_CONFIRMED',
        expect.any(String),
        expect.any(String),
        { topupId: 't1' },
      );
      expect(res).toEqual({ success: true, action: 'confirm', topupId: 't1' });
    });

    it('reject: marks rejected without crediting', async () => {
      prisma.walletTopupRequest.findFirst.mockResolvedValue({ id: 't1', shopId: SHOP });
      prisma.walletTopupRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.walletTopupRequest.findUniqueOrThrow.mockResolvedValue({
        id: 't1',
        walletId: 'w1',
        amount: 5000,
        customerId: CUSTOMER,
      });

      const res = await service.resolveTopupById('t1', 'reject');

      expect(prisma.wallet.update).not.toHaveBeenCalled();
      expect(prisma.walletTopupRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'rejected' }),
        }),
      );
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'WALLET_TOPUP_REJECTED',
        expect.any(String),
        expect.any(String),
        { topupId: 't1' },
      );
      expect(res.action).toBe('reject');
    });

    it('throws (double-confirm protection) when the guarded updateMany matches nothing', async () => {
      prisma.walletTopupRequest.findFirst.mockResolvedValue({ id: 't1', shopId: SHOP });
      prisma.walletTopupRequest.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.resolveTopupById('t1', 'confirm'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(gateway.notifyUser).not.toHaveBeenCalled();
    });
  });

  describe('adjust', () => {
    it('rejects a zero amount', async () => {
      await expect(
        service.adjust({ customerId: CUSTOMER, amount: 0 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when the customer is not in this shop', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.adjust({ customerId: CUSTOMER, amount: 1000 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('credits on a positive adjustment', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: CUSTOMER });
      prisma.wallet.upsert.mockResolvedValue({ id: 'w1' });
      prisma.wallet.update.mockResolvedValue({ id: 'w1', balance: 1000 });

      await service.adjust({ customerId: CUSTOMER, amount: 1000 } as any);

      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'w1' },
        data: { balance: { increment: 1000 } },
      });
      expect(gateway.notifyUser).toHaveBeenCalledWith(
        SHOP,
        CUSTOMER,
        'CUSTOMER',
        'WALLET_ADJUSTED',
        expect.any(String),
        expect.any(String),
        { walletId: 'w1' },
      );
    });

    it('debits on a negative adjustment', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: CUSTOMER });
      prisma.wallet.upsert.mockResolvedValue({ id: 'w1' });
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUniqueOrThrow.mockResolvedValue({ id: 'w1', balance: 0 });

      await service.adjust({ customerId: CUSTOMER, amount: -1000 } as any);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', balance: { gte: 1000 } },
        data: { balance: { decrement: 1000 } },
      });
    });
  });

  describe('getWalletTransactionsAdmin', () => {
    it('throws NotFound when the wallet is not in this shop', async () => {
      prisma.wallet.findFirst.mockResolvedValue(null);
      await expect(
        service.getWalletTransactionsAdmin('w-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns paginated transactions for an in-shop wallet', async () => {
      prisma.wallet.findFirst.mockResolvedValue({ id: 'w1', shopId: SHOP });
      prisma.walletTransaction.findMany.mockResolvedValue([{ id: 'tx1' }]);
      prisma.walletTransaction.count.mockResolvedValue(1);
      const res = await service.getWalletTransactionsAdmin('w1', 1, 20);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('listTopups', () => {
    it('filters by status and hydrates customer info', async () => {
      prisma.walletTopupRequest.findMany.mockResolvedValue([
        { id: 't1', customerId: CUSTOMER },
      ]);
      prisma.customer.findMany.mockResolvedValue([{ id: CUSTOMER, name: 'Alice' }]);

      const res = await service.listTopups('pending');

      expect(prisma.walletTopupRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP, status: 'pending' } }),
      );
      expect(res.data[0].customer).toEqual({ id: CUSTOMER, name: 'Alice' });
    });
  });

  describe('wallet payment method', () => {
    it('upserts the wallet payment method when toggled', async () => {
      prisma.paymentMethod.upsert.mockResolvedValue({ active: true });
      await service.toggleWalletPaymentMethod(true);
      expect(prisma.paymentMethod.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId_type: { shopId: SHOP, type: WALLET_PAYMENT_TYPE } },
          update: { active: true },
        }),
      );
    });

    it('reads the wallet payment method config', async () => {
      prisma.paymentMethod.findUnique.mockResolvedValue({ active: false });
      const res = await service.getWalletPaymentMethod();
      expect(res.data).toEqual({ active: false });
    });
  });

  describe('getWalletSummary', () => {
    it('aggregates balances and pending topups at the DB (no per-wallet fetch)', async () => {
      prisma.wallet.aggregate.mockResolvedValue({ _sum: { balance: 150000 }, _count: { _all: 4 } });
      prisma.walletTopupRequest.aggregate.mockResolvedValue({ _sum: { amount: 50000 }, _count: { _all: 2 } });

      const res = await service.getWalletSummary();

      // scoped to the shop, and only pending + not-expired topups counted
      expect(prisma.wallet.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shopId: SHOP }, _sum: { balance: true } }),
      );
      const topupArg = prisma.walletTopupRequest.aggregate.mock.calls[0][0];
      expect(topupArg.where).toMatchObject({ shopId: SHOP, status: 'pending' });
      expect(topupArg.where.expiresAt.gt).toBeInstanceOf(Date);
      // no over-fetch: never lists wallet rows to compute the totals
      expect(prisma.wallet.findMany).not.toHaveBeenCalled();

      expect(res).toEqual({
        walletCount: 4,
        totalBalance: 150000,
        pendingTopupCount: 2,
        pendingTopupAmount: 50000,
      });
    });

    it('coerces empty aggregates to zero', async () => {
      prisma.wallet.aggregate.mockResolvedValue({ _sum: { balance: null }, _count: { _all: 0 } });
      prisma.walletTopupRequest.aggregate.mockResolvedValue({ _sum: { amount: null }, _count: { _all: 0 } });

      const res = await service.getWalletSummary();

      expect(res).toEqual({
        walletCount: 0,
        totalBalance: 0,
        pendingTopupCount: 0,
        pendingTopupAmount: 0,
      });
    });
  });
});
