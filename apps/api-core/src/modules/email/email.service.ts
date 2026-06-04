import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async sendOrderConfirmation(to: string, order: any) {
    this.logger.log(`Queueing order confirmation email for order ${order.number} to ${to}`);
    await this.emailQueue.add('send-email', {
      to,
      subject: `Đơn hàng #${order.number} đã được xác nhận`,
      template: 'order-confirmed',
      context: { 
        orderNumber: order.number, 
        totalAmount: order.totalAmount,
        customerName: order.customerInfo?.name || 'Khách hàng',
        shippingAddress: order.shippingAddress
      }
    });
  }

  async sendOrderShipped(to: string, order: any) {
    this.logger.log(`Queueing order shipped email for order ${order.number} to ${to}`);
    await this.emailQueue.add('send-email', {
      to,
      subject: `Đơn hàng #${order.number} đang được giao`,
      template: 'order-shipped',
      context: { 
        orderNumber: order.number, 
        totalAmount: order.totalAmount,
        customerName: order.customerInfo?.name || 'Khách hàng',
      }
    });
  }

  async sendPaymentConfirmed(to: string, order: any) {
    this.logger.log(`Queueing payment confirmed email for order ${order.number} to ${to}`);
    await this.emailQueue.add('send-email', {
      to,
      subject: `Thanh toán thành công cho đơn hàng #${order.number}`,
      template: 'payment-confirmed',
      context: { 
        orderNumber: order.number, 
        totalAmount: order.totalAmount,
        customerName: order.customerInfo?.name || 'Khách hàng',
      }
    });
  }

  async sendResetPasswordEmail(to: string, resetUrl: string, customerName: string) {
    this.logger.log(`Queueing reset password email to ${to}`);
    await this.emailQueue.add('send-email', {
      to,
      subject: `Yêu cầu đặt lại mật khẩu`,
      template: 'reset-password',
      context: { 
        resetUrl,
        customerName,
      }
    });
  }
}
