import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    InventoryModule,
    AuthModule,
    CommonModule,
    NotificationsModule,
    EmailModule,
    WalletModule,
    // PAY-2: createOrder lên lịch tự huỷ đơn chuyển khoản chưa trả. Inject queue
    // trực tiếp (thay vì PaymentService) để tránh phụ thuộc vòng OrderModule↔PaymentModule.
    BullModule.registerQueue({ name: 'payment-timeout' }),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
