import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ShopTemplate } from '@ecommerce/database';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getShopSettings(shopId: string) {
    // Prisma Optimization: Using include to avoid N+1 issues when fetching owner data
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: {
          select: { fullName: true, email: true }, // Projection
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // MongoDB Optimization: using .lean() for 3x-5x faster query performance
    // Projection: sending back only publishedData to minimize network payload
    const template = (await ShopTemplate.findOne(
      { shopId },
      { publishedData: 1, _id: 0 },
    ).lean()) as any;

    return {
      metadata: shop,
      uiStructure: template?.publishedData || null,
    };
  }

  async getAllShops() {
    return this.prisma.shop.findMany({
      take: 20, // Cursor-based pagination placeholder
    });
  }
}
