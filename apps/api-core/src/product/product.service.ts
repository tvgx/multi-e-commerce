import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../database/prisma.service';
import {
  ProductLayout,
  ProductDocument,
} from './schemas/product-layout.schema';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @InjectModel(ProductLayout.name)
    private productLayoutModel: Model<ProductDocument>,
  ) {}

  async getProductsByShop(shopId: string, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: { shopId, status: 'PUBLISHED' },
      take: limit,
      select: {
        id: true,
        name: true,
        basePrice: true,
        inStock: true,
        slug: true,
      },
    });
    return products;
  }

  async getProductDetails(productId: string) {
    const productPostgres = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productPostgres) {
      throw new NotFoundException('Product not found or unavailable');
    }

    const layoutDoc = await this.productLayoutModel
      .findOne({ productId })
      .lean();

    return {
      ...productPostgres,
      layout: layoutDoc,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createProduct(shopId: string, productData: unknown) {
    // Placeholder function cho createProduct
    return { status: 'Not implemented' };
  }
}
