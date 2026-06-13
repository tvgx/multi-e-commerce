import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { GlobalLayoutSchema, PageLayoutSchema, UIComponentCatalogSchema } from '@ecommerce/database';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'GlobalLayout', schema: GlobalLayoutSchema.clone() },
      { name: 'PageLayout', schema: PageLayoutSchema.clone() },
      { name: 'UIComponentCatalog', schema: UIComponentCatalogSchema.clone() },
    ]),
  ],
  controllers: [LayoutController],
  providers: [LayoutService],
  exports: [LayoutService],
})
export class LayoutModule {}

