import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { SeedController } from './seed.controller';
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
  controllers: [ProductController, SeedController],
  providers: [ProductService],
})
export class ProductModule {}
