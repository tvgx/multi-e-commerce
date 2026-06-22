import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BuildController } from './build.controller';
import { BuildService } from './build.service';
import { SHOP_BUILD_QUEUE } from './build.service';

/**
 * Producer + status endpoints cho build shop nền.
 * KHÔNG đăng ký processor — consumer là worker độc lập /scripts/shop-builder
 * (chạy `npm run worker:shop-builder`). Cả hai dùng chung queue 'shop-build'
 * trên cùng Redis (xem BullModule.forRootAsync trong app.module.ts).
 */
@Module({
  imports: [BullModule.registerQueue({ name: SHOP_BUILD_QUEUE })],
  controllers: [BuildController],
  providers: [BuildService],
  exports: [BuildService],
})
export class BuildModule {}
