import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentModule } from '../payment/payment.module';
import { TaxModule } from '../tax/tax.module';
import { ShippingModule } from '../shipping/shipping.module';
import { PromotionModule } from '../promotion/promotion.module';

@Module({
  imports: [
    DatabaseModule,
    PaymentModule,
    TaxModule,
    ShippingModule,
    PromotionModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

