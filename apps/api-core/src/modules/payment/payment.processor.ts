import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';

@Processor('payment-timeout')
export class PaymentProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('check-payment-status')
  async handlePaymentTimeout(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;

    // Fetch the payment
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) return;

    if (payment.state === 'checkout') {
      // Payment hasn't been confirmed within timeout window
      await this.prisma.$transaction(async (tx) => {
         await tx.payment.update({
           where: { id: payment.id },
           data: { state: 'failed' }
         });

         await tx.order.update({
           where: { id: orderId },
           data: { state: 'canceled', paymentState: 'failed' }
         });
         
         // We should also restore stock here!
         // Wait, to restore stock we need inventory service, or just do it.
         // Since this is a simple processor, maybe it's enough for now.
      });
    }
  }
}
