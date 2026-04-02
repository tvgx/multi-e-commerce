import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ShippingService],
  controllers: [ShippingController],
  exports: [ShippingService],
})
export class ShippingModule {}
