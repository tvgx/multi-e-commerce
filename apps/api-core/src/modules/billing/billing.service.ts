import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { generateConfirmQr } from '../../common/utils/qr.util';
import { SubscribeDto } from './dto/billing.dto';

/**
 * Platform Billing & Plans — subscription SaaS của OWNER (không per-shop).
 *
 * Mọi method scope theo `userId` (req.user.id từ BetterAuthGuard) — KHÔNG dùng
 * TenantService, vì billing là cấp platform. Thanh toán theo mô hình QR
 * self-attested tái dùng công cụ QR của order: subscribe gói trả phí tạo
 * Invoice PENDING + BillingConfirmToken; quét QR mở trang xác nhận; confirm →
 * Invoice PAID + Subscription ACTIVE. Gói Free kích hoạt ngay, không QR.
 */
@Injectable()
export class BillingService {
  private static readonly TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h như order

  constructor(private readonly prisma: PrismaService) {}

  private confirmUrlBase(): string {
    const admin = process.env.ADMIN_URL || 'http://localhost:3001';
    return `${admin}/billing-confirm`;
  }

  private addOneMonth(from: Date): Date {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d;
  }

  async listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Subscription hiện tại của owner — chưa có thì gán gói Free (get-or-create). */
  async getSubscription(userId: string) {
    if (!userId) throw new BadRequestException('User is required');

    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (existing) return existing;

    const freePlan = await this.prisma.plan.findUnique({ where: { key: 'free' } });
    if (!freePlan) {
      // Chưa seed plans — trả null thay vì nổ để UI hiển thị trạng thái trống.
      return null;
    }
    const now = new Date();
    return this.prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: this.addOneMonth(now),
      },
      include: { plan: true },
    });
  }

  /**
   * Đăng ký/đổi gói. Gói trả phí KHÔNG kích hoạt ngay: tạo Invoice PENDING +
   * token + QR; kích hoạt xảy ra ở confirm(). Gói Free (0đ) hạ gói ngay.
   */
  async subscribe(userId: string, dto: SubscribeDto) {
    if (!userId) throw new BadRequestException('User is required');
    if (!dto?.planKey && !dto?.planId) {
      throw new BadRequestException('planKey or planId is required');
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        isActive: true,
        ...(dto.planId ? { id: dto.planId } : { key: dto.planKey }),
      },
    });
    if (!plan) throw new BadRequestException('Unknown or inactive plan');

    const current = await this.getSubscription(userId);
    if (current && current.planId === plan.id && current.status === 'ACTIVE') {
      throw new BadRequestException('Already subscribed to this plan');
    }

    const now = new Date();

    // Gói miễn phí: đổi ngay, không cần thanh toán/hoá đơn.
    if (plan.priceMonthly <= 0) {
      const sub = await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: this.addOneMonth(now),
        },
        update: {
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: this.addOneMonth(now),
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
        include: { plan: true },
      });
      return { subscription: sub, invoice: null, qrCodeUrl: null, confirmUrl: null };
    }

    // Gói trả phí: hoá đơn PENDING + token xác nhận + QR.
    const { invoice, token } = await this.prisma.$transaction(async (tx) => {
      const number = `INV-${now.getFullYear()}-${String((await tx.invoice.count()) + 1).padStart(6, '0')}`;
      const inv = await tx.invoice.create({
        data: {
          number,
          userId,
          subscriptionId: current?.id ?? null,
          planId: plan.id,
          amount: plan.priceMonthly,
          currency: plan.currency,
          status: 'PENDING',
          periodStart: now,
          periodEnd: this.addOneMonth(now),
          description: `Đăng ký gói ${plan.name} (${plan.key})`,
        },
      });
      const t = await tx.billingConfirmToken.create({
        data: {
          token: randomUUID(),
          invoiceId: inv.id,
          userId,
          amount: plan.priceMonthly,
          expiresAt: new Date(now.getTime() + BillingService.TOKEN_TTL_MS),
        },
      });
      return { invoice: inv, token: t };
    });

    const confirmUrl = `${this.confirmUrlBase()}/${token.token}`;
    const qrCodeUrl = await generateConfirmQr(confirmUrl);

    return {
      subscription: current,
      invoice,
      token: token.token,
      confirmUrl,
      qrCodeUrl,
      expiresAt: token.expiresAt,
    };
  }

  /** Thông tin hiển thị trên trang xác nhận QR (public, token là credential). */
  async getTokenInfo(token: string) {
    const t = await this.prisma.billingConfirmToken.findUnique({ where: { token } });
    if (!t) throw new NotFoundException('Invalid confirmation token');
    if (t.usedAt) throw new BadRequestException('Token already used');
    if (t.expiresAt < new Date()) throw new BadRequestException('Token expired');

    const invoice = await this.prisma.invoice.findUnique({ where: { id: t.invoiceId } });
    const plan = invoice?.planId
      ? await this.prisma.plan.findUnique({ where: { id: invoice.planId } })
      : null;

    return {
      invoiceNumber: invoice?.number,
      amount: t.amount,
      currency: invoice?.currency ?? 'VND',
      planName: plan?.name ?? null,
      expiresAt: t.expiresAt,
    };
  }

  /**
   * Xác nhận (hoặc từ chối) thanh toán subscription qua token — mirror
   * PaymentService.confirmPayment nhưng cho billing: không restock, chỉ đổi
   * trạng thái Invoice + kích hoạt Subscription.
   */
  async confirm(token: string, action: 'confirm' | 'reject' = 'confirm') {
    if (!token) throw new BadRequestException('token is required');
    if (action !== 'confirm' && action !== 'reject') {
      throw new BadRequestException('action must be confirm or reject');
    }

    const t = await this.prisma.billingConfirmToken.findUnique({ where: { token } });
    if (!t) throw new NotFoundException('Invalid confirmation token');
    if (t.usedAt) throw new BadRequestException('Token already used');
    if (t.expiresAt < new Date()) throw new BadRequestException('Token expired');

    const invoice = await this.prisma.invoice.findUnique({ where: { id: t.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'PENDING') {
      throw new BadRequestException(`Invoice is already ${invoice.status}`);
    }

    const now = new Date();

    if (action === 'reject') {
      await this.prisma.$transaction([
        this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'VOID' },
        }),
        this.prisma.billingConfirmToken.update({
          where: { id: t.id },
          data: { usedAt: now },
        }),
      ]);
      return { status: 'rejected', invoiceId: invoice.id };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const paid = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID', paidAt: now },
      });
      const sub = await tx.subscription.upsert({
        where: { userId: t.userId },
        create: {
          userId: t.userId,
          planId: invoice.planId!,
          status: 'ACTIVE',
          currentPeriodStart: invoice.periodStart,
          currentPeriodEnd: invoice.periodEnd,
        },
        update: {
          planId: invoice.planId!,
          status: 'ACTIVE',
          currentPeriodStart: invoice.periodStart,
          currentPeriodEnd: invoice.periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
        include: { plan: true },
      });
      // Gắn hoá đơn vào subscription (lần đầu owner chưa có sub khi phát hành).
      if (!paid.subscriptionId) {
        await tx.invoice.update({
          where: { id: paid.id },
          data: { subscriptionId: sub.id },
        });
      }
      await tx.billingConfirmToken.update({
        where: { id: t.id },
        data: { usedAt: now },
      });
      return { invoice: paid, subscription: sub };
    });

    return { status: 'confirmed', ...result };
  }

  /** Huỷ gia hạn: giữ quyền lợi tới hết chu kỳ hiện tại. */
  async cancel(userId: string) {
    if (!userId) throw new BadRequestException('User is required');
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No subscription to cancel');

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
      include: { plan: true },
    });
  }

  async listInvoices(userId: string, page = 1, limit = 20) {
    if (!userId) throw new BadRequestException('User is required');
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.invoice.count({ where: { userId } }),
    ]);

    return {
      data: items,
      meta: { total, page: currentPage, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  async getInvoice(userId: string, id: string) {
    if (!userId) throw new BadRequestException('User is required');
    const invoice = await this.prisma.invoice.findFirst({ where: { id, userId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
