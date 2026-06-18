import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { OrderModule } from '../order/order.module';

@Module({
  // SHIP-1: import OrderModule (export OrderService) để tái dùng voidOrder. Một
  // chiều — OrderModule không import ShippingModule nên không có vòng phụ thuộc.
  imports: [NotificationsModule, EmailModule, OrderModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
