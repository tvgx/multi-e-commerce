import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { DatabaseModule } from '../database/database.module';
import { DomainVerifyService } from './domain-verify.service';
import { LayoutModule } from '../layout/layout.module';
import { ProductModule } from '../product/product.module';
import { CollectionModule } from '../collection/collection.module';

import { NavigationModule } from '../navigation/navigation.module';
import { ShopBootstrapController } from './shop-bootstrap.controller';

@Module({
  imports: [
    DatabaseModule,
    LayoutModule,
    ProductModule,
    CollectionModule,
    NavigationModule,
  ],
  providers: [ShopService, DomainVerifyService],
  controllers: [ShopController, ShopBootstrapController],
  exports: [ShopService, DomainVerifyService],
})
export class ShopModule {}
