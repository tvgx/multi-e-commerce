import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProcessor } from './payment.processor';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment-timeout',
    }),
    NotificationsModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentProcessor]
})
export class PaymentModule {}
