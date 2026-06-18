import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
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

    // Here you would integrate with VNPAY/Momo/Stripe etc.
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

  async handleWebhook(dto: PaymentWebhookDto, shopId?: string) {
    // In a real webhook, shopId might come from the webhook payload or URL path.
    // We update the order status based on transaction result.
    return { status: 'success', transactionId: dto.transactionId };
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

