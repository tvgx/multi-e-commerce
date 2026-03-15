import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {
  ProductLayout,
  ProductLayoutSchema,
} from './schemas/product-layout.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductLayout.name, schema: ProductLayoutSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
