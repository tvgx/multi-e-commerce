import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProcessor } from './payment.processor';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment-timeout',
    }),
    NotificationsModule,
    EmailModule,
    // PAY-1/PAY-2: confirmPayment(reject) + PaymentProcessor dùng OrderService.voidOrder
    // để hoàn kho. OrderModule không import ngược PaymentModule nên không có vòng phụ thuộc.
    OrderModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentProcessor]
})
export class PaymentModule {}
