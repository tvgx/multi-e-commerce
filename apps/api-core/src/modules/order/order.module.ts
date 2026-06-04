import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [InventoryModule, AuthModule, CommonModule, NotificationsModule, EmailModule],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
