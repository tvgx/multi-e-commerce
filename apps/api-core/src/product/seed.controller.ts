import { Controller, Post } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductLayout,
  ProductDocument,
} from './schemas/product-layout.schema';
import { PrismaClient } from '@ecommerce/database';

const globalPrisma = new PrismaClient();

@Controller('seed')
export class SeedController {
  constructor(
    private prisma: PrismaService,
    @InjectModel(ProductLayout.name)
    private productLayoutModel: Model<ProductDocument>,
  ) {}

  @Post('hybrid')
  async seedHybridData() {
    console.log('--- BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU ---');

    console.log('\n🗑️ Đang dọn dẹp dữ liệu cũ (Tùy chọn)...');
    await this.productLayoutModel.deleteMany({});
    await globalPrisma.product.deleteMany({});
    await globalPrisma.shop.deleteMany({});
    await globalPrisma.user.deleteMany({});

    console.log('\n[PostgreSQL] Đang tạo dữ liệu cấu trúc...');

    const user = await globalPrisma.user.create({
      data: {
        email: 'test-shop-owner@example.com',
        passwordHash: 'hashed_password_123',
        fullName: 'Nguyễn Văn Chủ Shop',
        role: 'OWNER',
      },
    });

    const shop = await globalPrisma.shop.create({
      data: {
        ownerId: user.id,
        name: 'Sneaker Head Store',
        domain: 'sneaker-head.demo.com',
        status: 'PUBLISHED',
      },
    });

    const productA = await globalPrisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Giày Thể Thao Nike Air Max 270',
        slug: 'giay-the-thao-nike-air-max-270-seed',
        basePrice: 2500000,
        currency: 'VND',
        inStock: 50,
        sku: 'NIKE-AM270-BLK',
        categoryId: 'sneakers',
        brand: 'Nike',
        status: 'PUBLISHED',
      },
    });

    const productB = await globalPrisma.product.create({
      data: {
        shopId: shop.id,
        name: 'Áo Thun Cotton Form Rộng Basic',
        slug: 'ao-thun-cotton-form-rong-basic-seed',
        basePrice: 199000,
        currency: 'VND',
        inStock: 200,
        sku: 'TSHIRT-CTN-WHT',
        categoryId: 'clothing',
        status: 'PUBLISHED',
      },
    });

    console.log('\n[MongoDB] Đang đồng bộ dữ liệu giao diện...');

    await this.productLayoutModel.create([
      {
        productId: productA.id,
        shopId: shop.id,
        descriptionHtml:
          '<h2>Nike Air Max 270</h2><p>Mẫu giày huyền thoại với đệm khí êm ái, mang lại cảm giác thoải mái tối đa cho cả ngày dài vận động.</p>',
        imageUrls: [
          'https://example.com/images/nike-1.jpg',
          'https://example.com/images/nike-2.jpg',
        ],
        attributes: {
          Color: ['Black', 'White/Red'],
          Size: ['40', '41', '42', '43'],
          Material: 'Mesh upper, Rubber sole',
        },
        seoData: {
          metaTitle: 'Mua Giày Nike Air Max 270 Đen Chính Hãng',
          metaDescription:
            'Sản phẩm giày Nike Air Max cực xịn dành cho giới trẻ.',
          keywords: ['giày thể thao', 'nike chính hãng', 'air max'],
        },
      },
      {
        productId: productB.id,
        shopId: shop.id,
        descriptionHtml:
          '<h3>Áo Thun Trơn Basic</h3><p>Mẫu áo thun dễ phối đồ nhất, phù hợp với mọi phong cách. Chất vải 100% cotton thoáng mát.</p>',
        imageUrls: ['https://example.com/images/tshirt-white.jpg'],
        attributes: {
          Color: ['White', 'Black', 'Grey'],
          Size: ['S', 'M', 'L', 'XL'],
          Fit: 'Oversized',
        },
      },
    ]);

    return {
      message: 'Seed hybrid data successfully!',
      postgres: {
        shopId: shop.id,
        products: [productA.id, productB.id],
      },
      mongo: {
        docsCreated: 2,
      },
    };
  }
}
