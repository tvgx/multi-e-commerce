import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from '../database/database.module';
import { DomainVerifyService } from './domain-verify.service';

@Module({
  imports: [DatabaseModule],
  providers: [ShopService, DomainVerifyService],
  controllers: [ShopController],
  exports: [ShopService, DomainVerifyService],
})
export class ShopModule {}
