import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { OrderService } from '../order/order.service';

@Processor('payment-timeout')
export class PaymentProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
  ) {}

  @Process('check-payment-status')
  async handlePaymentTimeout(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    // Fetch the latest payment
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    // Chỉ huỷ khi vẫn đang chờ thanh toán (payment 'checkout'). Nếu khách đã
    // xác nhận/đã bị từ chối trước đó thì bỏ qua — không huỷ nhầm đơn đã trả.
    if (!payment || payment.state !== 'checkout') return;

    // PAY-2: timeout phải HOÀN KHO (đơn chuyển khoản đã trừ kho lúc checkout).
    // voidOrder dùng order.shopId nên chạy được ở worker không có tenant context;
    // restoreStock idempotent nên an toàn nếu nhánh reject đã chạy đồng thời.
    await this.prisma.$transaction((tx) =>
      this.orderService.voidOrder(tx, order, {
        restock: true,
        failPayments: true,
        createdBy: 'system',
      }),
    );
  }
}
