import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from '../database/database.module';
import { DomainVerifyService } from './domain-verify.service';
import { LayoutModule } from '../layout/layout.module';

@Module({
  imports: [DatabaseModule, LayoutModule],
  providers: [ShopService, DomainVerifyService],
  controllers: [ShopController],
  exports: [ShopService, DomainVerifyService],
})
export class ShopModule {}
