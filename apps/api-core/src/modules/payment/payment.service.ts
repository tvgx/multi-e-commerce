import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { OrderService } from '../order/order.service';

// PAY-3: gateway result codes that mean "paid". Real providers
// (VNPAY/Momo/Stripe) map their own codes onto these in the controller/adapter.
const SUCCESS_STATUSES = new Set(['success', 'paid', 'completed', 'captured']);

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @InjectQueue('payment-timeout') private readonly timeoutQueue: Queue,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly orderService: OrderService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createPaymentUrl(dto: CreatePaymentDto) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, shopId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // PAY-3: provider SDKs (VNPAY/Momo/Stripe) are not wired yet — this returns a
    // sandbox URL. The settlement side IS live: once a provider redirects/calls
    // back, route it through handleWebhook (which updates the order + restocks on
    // decline). Wiring a real provider = build its checkout URL here + normalise
    // its callback into PaymentWebhookDto.
    const mockCheckoutUrl = `https://checkout.sandbox.payment.com/${dto.orderId}?amount=${dto.amount}`;

    return { checkoutUrl: mockCheckoutUrl };
  }

  async getPaymentMethods(shopId?: string) {
    const id = shopId || this.getShopId();
    const methods = await this.prisma.paymentMethod.findMany({
      where: { shopId: id, active: true }
    });
    return { data: methods };
  }

  /**
   * PAY-3: settle an order from a payment-gateway callback. Previously this just
   * returned `{status:'success'}` and never touched the order — so a real gateway
   * confirming/declining a payment changed nothing (order stuck in `checkout`,
   * stock held forever on a decline). Now it verifies the signature, then on
   * success marks the order paid/confirmed, and on failure restocks + fails the
   * payment via the shared {@link OrderService.voidOrder}. Idempotent so gateway
   * retries don't double-process.
   *
   * NOTE: provider SDKs (VNPAY/Momo/Stripe) are still not wired — `createPaymentUrl`
   * remains a sandbox stub. This handler is the provider-agnostic settlement core;
   * a per-provider adapter normalises the raw callback into PaymentWebhookDto +
   * implements the provider's exact signature scheme in {@link verifyWebhookSignature}.
   */
  async handleWebhook(dto: PaymentWebhookDto, shopId?: string) {
    if (!dto.orderId?.trim()) throw new BadRequestException('orderId is required');
    if (!dto.status?.trim()) throw new BadRequestException('status is required');

    this.verifyWebhookSignature(dto);

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, ...(shopId ? { shopId } : {}) },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Idempotency: gateways retry callbacks. Never re-settle a terminal order.
    if (
      order.paymentState === 'paid' ||
      order.paymentState === 'refunded' ||
      order.state === 'canceled'
    ) {
      return {
        status: 'ignored',
        reason: 'order already finalized',
        orderId: order.id,
      };
    }

    const succeeded = SUCCESS_STATUSES.has(dto.status.toLowerCase());

    const result = await this.prisma.$transaction(async (tx) => {
      if (succeeded) {
        await tx.payment.updateMany({
          where: { orderId: order.id, state: { in: ['checkout', 'pending'] } },
          data: { state: 'completed', responseCode: dto.transactionId },
        });
        const updated = await tx.order.update({
          where: { id: order.id },
          data: { state: 'confirmed', paymentState: 'paid' },
        });
        return { updated, succeeded: true };
      }
      // Declined/failed/cancelled at the gateway → restock + fail the payment.
      const { order: voided } = await this.orderService.voidOrder(tx, order, {
        restock: true,
        failPayments: true,
        createdBy: 'system',
      });
      return { updated: voided, succeeded: false };
    });

    this.notificationsGateway
      .notifyUser(
        order.shopId,
        order.customerId,
        'CUSTOMER',
        result.succeeded ? 'PAYMENT_CONFIRMED' : 'PAYMENT_REJECTED',
        result.succeeded ? 'Payment Confirmed' : 'Payment Rejected',
        result.succeeded
          ? `Your payment for order ${order.number || order.id} has been confirmed.`
          : `Your payment for order ${order.number || order.id} was declined.`,
        { orderId: order.id, transactionId: dto.transactionId },
      )
      .catch((err) => console.error('Notification error', err));

    if (result.succeeded) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: order.customerId },
      });
      if (customer?.email) {
        this.emailService.sendPaymentConfirmed(customer.email, order).catch(console.error);
      }
    }

    return {
      status: result.succeeded ? 'success' : 'failed',
      orderId: order.id,
      transactionId: dto.transactionId,
      paymentState: result.succeeded ? 'paid' : 'failed',
    };
  }

  /**
   * Verify a webhook is genuinely from the gateway. When PAYMENT_WEBHOOK_SECRET
   * is set we require an HMAC-SHA256 over `transactionId|orderId|status` (a
   * generic canonical — real providers sign their own field set, swap that in
   * per-provider here). With no secret configured we're in sandbox/dev mode:
   * skip verification but log loudly so it's never silently unprotected in prod.
   */
  private verifyWebhookSignature(dto: PaymentWebhookDto): void {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn(
        'PAYMENT_WEBHOOK_SECRET not set — accepting payment webhook without signature verification (sandbox mode).',
      );
      return;
    }
    if (!dto.signature) {
      throw new ForbiddenException('Missing webhook signature');
    }
    const expected = createHmac('sha256', secret)
      .update(`${dto.transactionId}|${dto.orderId}|${dto.status}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(dto.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Invalid webhook signature');
    }
  }

  async confirmPayment(token: string, action: 'confirm' | 'reject') {
     const confirmToken = await this.prisma.paymentConfirmToken.findUnique({
       where: { token }
     });

     if (!confirmToken) {
       throw new BadRequestException('Invalid payment token');
     }

     if (confirmToken.usedAt) {
       throw new BadRequestException('Payment token already used');
     }

     if (confirmToken.expiresAt < new Date()) {
       throw new BadRequestException('Payment token expired');
     }

     return this.prisma.$transaction(async (tx) => {
       await tx.paymentConfirmToken.update({
         where: { id: confirmToken.id },
         data: { usedAt: new Date() }
       });

       const payment = await tx.payment.findUnique({ where: { id: confirmToken.paymentId } });
       if (!payment) throw new NotFoundException('Payment record not found');
       const order = await tx.order.findUnique({ where: { id: confirmToken.orderId } });

       // The confirm token lives 24h but the payment-timeout job auto-cancels +
       // restocks the order after 15'. Without this guard, confirming after that
       // window would resurrect a canceled order to confirmed/paid WITHOUT
       // re-decrementing the stock that was already returned → oversell. Same for
       // an order already paid/refunded by another path. Throwing rolls back the
       // token's usedAt update too, so the token isn't silently burned.
       if (
         order &&
         (order.state === 'canceled' ||
           order.paymentState === 'paid' ||
           order.paymentState === 'refunded')
       ) {
         throw new BadRequestException('Order is no longer awaiting payment');
       }

       if (action === 'confirm') {
         await tx.payment.update({
           where: { id: payment.id },
           data: { state: 'completed' }
         });

         await tx.order.update({
           where: { id: confirmToken.orderId },
           data: { state: 'confirmed', paymentState: 'paid' }
         });

         if (order) {
           this.notificationsGateway.notifyUser(
             order.shopId,
             order.customerId,
             'CUSTOMER',
             'PAYMENT_CONFIRMED',
             'Payment Confirmed',
             `Your payment for order ${order.number || order.id} has been confirmed.`,
             { orderId: order.id, paymentId: payment.id }
           ).catch(err => console.error('Notification error', err));
           
           const customer = await tx.customer.findUnique({ where: { id: order.customerId } });
           if (customer?.email) {
             this.emailService.sendPaymentConfirmed(customer.email, order).catch(console.error);
           }
         }
       } else {
         if (!order) throw new NotFoundException('Order not found');

         // PAY-1: từ chối thanh toán phải HOÀN KHO — đơn chuyển khoản đã trừ kho
         // lúc checkout. Trước đây chỉ set state 'canceled' nên rò rỉ tồn kho.
         // voidOrder cũng đánh dấu payment đang chờ là 'failed' (failPayments).
         await this.orderService.voidOrder(tx, order, {
           restock: true,
           failPayments: true,
           createdBy: 'system',
         });

         this.notificationsGateway.notifyUser(
           order.shopId,
           order.customerId,
           'CUSTOMER',
           'PAYMENT_REJECTED',
           'Payment Rejected',
           `Your payment for order ${order.number || order.id} has been rejected.`,
           { orderId: order.id, paymentId: payment.id }
         ).catch(err => console.error('Notification error', err));
       }

       return { success: true, action };
     });
  }

  async getPaymentStatus(orderId: string) {
     const shopId = this.getShopId();

     const p = await this.prisma.payment.findFirst({
        where: { orderId, order: { shopId } },
        select: { state: true, order: { select: { state: true } } }
     });

     if (!p) throw new NotFoundException('Payment not found');

     return {
        paymentState: p.state,
        orderState: p.order.state
     };
  }

  async schedulePaymentTimeout(orderId: string, delayMs = 15 * 60 * 1000) {
     await this.timeoutQueue.add('check-payment-status', { orderId }, { delay: delayMs });
  }

  async getTokenInfo(token: string) {
    const confirmToken = await this.prisma.paymentConfirmToken.findUnique({
      where: { token }
    });

    if (!confirmToken) {
      throw new NotFoundException('Invalid or expired payment token');
    }

    if (confirmToken.usedAt) {
      throw new BadRequestException('Payment token already used');
    }

    if (confirmToken.expiresAt < new Date()) {
      throw new BadRequestException('Payment token expired');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: confirmToken.orderId },
      include: { shop: true }
    });

    const payment = await this.prisma.payment.findUnique({
      where: { id: confirmToken.paymentId }
    });

    if (!order || !payment) {
      throw new NotFoundException('Related order or payment not found');
    }

    return {
      orderId: confirmToken.orderId,
      amount: payment.amount,
      shopName: order.shop.name,
      shopDomain: order.shop.domain,
      expiresAt: confirmToken.expiresAt,
    };
  }
}

