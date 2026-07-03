import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../../../test/helpers/prisma-mock';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: MockPrisma;

  const USER = 'owner-1';
  const FREE = { id: 'plan-free', key: 'free', name: 'Free', priceMonthly: 0, currency: 'VND' };
  const PRO = { id: 'plan-pro', key: 'pro', name: 'Pro', priceMonthly: 199000, currency: 'VND' };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BillingService);
  });

  describe('getSubscription', () => {
    it('returns the existing subscription with its plan', async () => {
      const sub = { id: 'sub-1', userId: USER, plan: FREE };
      prisma.subscription.findUnique.mockResolvedValue(sub);
      await expect(service.getSubscription(USER)).resolves.toBe(sub);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('auto-provisions the Free plan when the owner has none', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue(FREE);
      prisma.subscription.create.mockResolvedValue({ id: 'sub-new', plan: FREE });

      const res = await service.getSubscription(USER);

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: USER, planId: FREE.id, status: 'ACTIVE' }),
        }),
      );
      expect(res).toEqual({ id: 'sub-new', plan: FREE });
    });

    it('returns null (not an error) when plans are not seeded yet', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(service.getSubscription(USER)).resolves.toBeNull();
    });
  });

  describe('subscribe', () => {
    it('rejects a request without planKey/planId', async () => {
      await expect(service.subscribe(USER, {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown plan', async () => {
      prisma.plan.findFirst.mockResolvedValue(null);
      await expect(
        service.subscribe(USER, { planKey: 'nope' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects re-subscribing to the current active plan', async () => {
      prisma.plan.findFirst.mockResolvedValue(PRO);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: USER,
        planId: PRO.id,
        status: 'ACTIVE',
        plan: PRO,
      });
      await expect(
        service.subscribe(USER, { planKey: 'pro' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('activates a free plan immediately without invoice or QR', async () => {
      prisma.plan.findFirst.mockResolvedValue(FREE);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: USER,
        planId: PRO.id,
        status: 'ACTIVE',
        plan: PRO,
      });
      prisma.subscription.upsert.mockResolvedValue({ id: 'sub-1', plan: FREE });

      const res = await service.subscribe(USER, { planKey: 'free' });

      expect(res.invoice).toBeNull();
      expect(res.qrCodeUrl).toBeNull();
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('creates a PENDING invoice + confirm token + QR for a paid plan', async () => {
      prisma.plan.findFirst.mockResolvedValue(PRO);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        userId: USER,
        planId: FREE.id,
        status: 'ACTIVE',
        plan: FREE,
      });
      prisma.invoice.count.mockResolvedValue(0);
      prisma.invoice.create.mockResolvedValue({
        id: 'inv-1',
        number: 'INV-2026-000001',
        status: 'PENDING',
        amount: PRO.priceMonthly,
      });
      prisma.billingConfirmToken.create.mockResolvedValue({
        token: 'tok-123',
        expiresAt: new Date(Date.now() + 1000 * 60),
      });

      const res = await service.subscribe(USER, { planKey: 'pro' });

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER,
            planId: PRO.id,
            amount: PRO.priceMonthly,
            status: 'PENDING',
          }),
        }),
      );
      expect(res.token).toBe('tok-123');
      expect(res.confirmUrl).toContain('/billing-confirm/tok-123');
      // data-URI PNG từ công cụ QR dùng chung
      expect(res.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.invoice?.status).toBe('PENDING');
    });
  });

  describe('confirm', () => {
    const TOKEN = {
      id: 'bct-1',
      token: 'tok-123',
      invoiceId: 'inv-1',
      userId: USER,
      amount: PRO.priceMonthly,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };
    const INVOICE = {
      id: 'inv-1',
      number: 'INV-2026-000001',
      userId: USER,
      subscriptionId: 'sub-1',
      planId: PRO.id,
      status: 'PENDING',
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    };

    it('404s on an unknown token', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue(null);
      await expect(service.confirm('bad')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a used token', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue({
        ...TOKEN,
        usedAt: new Date(),
      });
      await expect(service.confirm('tok-123')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired token', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue({
        ...TOKEN,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.confirm('tok-123')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the invoice is no longer PENDING', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue(TOKEN);
      prisma.invoice.findUnique.mockResolvedValue({ ...INVOICE, status: 'PAID' });
      await expect(service.confirm('tok-123')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('confirm: marks invoice PAID, activates the subscription, burns the token', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue(TOKEN);
      prisma.invoice.findUnique.mockResolvedValue(INVOICE);
      prisma.invoice.update.mockResolvedValue({ ...INVOICE, status: 'PAID' });
      prisma.subscription.upsert.mockResolvedValue({
        id: 'sub-1',
        planId: PRO.id,
        status: 'ACTIVE',
        plan: PRO,
      });

      const res = await service.confirm('tok-123', 'confirm');

      expect(res.status).toBe('confirmed');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INVOICE.id },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER },
          update: expect.objectContaining({ planId: PRO.id, status: 'ACTIVE' }),
        }),
      );
      expect(prisma.billingConfirmToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: TOKEN.id } }),
      );
    });

    it('reject: voids the invoice without touching the subscription', async () => {
      prisma.billingConfirmToken.findUnique.mockResolvedValue(TOKEN);
      prisma.invoice.findUnique.mockResolvedValue(INVOICE);

      const res = await service.confirm('tok-123', 'reject');

      expect(res).toEqual({ status: 'rejected', invoiceId: INVOICE.id });
      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('invoices', () => {
    it('scopes getInvoice by userId (404 for another owner)', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      await expect(service.getInvoice(USER, 'inv-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: { id: 'inv-x', userId: USER },
      });
    });
  });
});
