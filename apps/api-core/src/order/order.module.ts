import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DatabaseModule, PaymentModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
