import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { to, subject, template, context } = job.data;
    
    this.logger.log(`Processing email job for ${to} - ${subject}`);

    try {
      // Very basic templating logic (in reality, you would use Handlebars/EJS)
      let htmlContent = `<h1>${subject}</h1><p>Xin chào ${context.customerName},</p>`;
      
      if (template === 'order-confirmed') {
        htmlContent += `<p>Đơn hàng <strong>#${context.orderNumber}</strong> của bạn đã được xác nhận.</p>
                        <p>Tổng tiền: <strong>${context.totalAmount.toLocaleString('vi-VN')}đ</strong></p>`;
      } else if (template === 'order-shipped') {
        htmlContent += `<p>Đơn hàng <strong>#${context.orderNumber}</strong> đang trên đường giao đến bạn.</p>`;
      } else if (template === 'payment-confirmed') {
        htmlContent += `<p>Chúng tôi đã nhận được thanh toán cho đơn hàng <strong>#${context.orderNumber}</strong>.</p>`;
      } else if (template === 'reset-password') {
        htmlContent += `<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để đặt lại mật khẩu của bạn:</p>
                        <p><a href="${context.resetUrl}">${context.resetUrl}</a></p>
                        <p>Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>`;
      }

      htmlContent += `<p>Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi!</p>`;

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM') || '"OmniCommerce" <noreply@omnicommerce.io>',
        to,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
