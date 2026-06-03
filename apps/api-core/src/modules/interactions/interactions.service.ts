import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { ToggleWishlistDto, AddSearchHistoryDto, CreateReviewDto, GetReviewsDto } from './dto/interactions.dto';

@Injectable()
export class InteractionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async toggleWishlist(customerId: string, dto: ToggleWishlistDto) {
    const shopId = this.getShopId();
    
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId: dto.productId
        }
      }
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id }
      });
      return { status: 'removed', productId: dto.productId };
    } else {
      await this.prisma.wishlistItem.create({
        data: {
          shopId,
          customerId,
          productId: dto.productId
        }
      });
      return { status: 'added', productId: dto.productId };
    }
  }

  async getWishlist(customerId: string) {
    const shopId = this.getShopId();
    const items = await this.prisma.wishlistItem.findMany({
      where: { shopId, customerId },
      orderBy: { createdAt: 'desc' }
    });
    return { data: items };
  }

  async addSearchHistory(customerId: string, dto: AddSearchHistoryDto) {
    const shopId = this.getShopId();
    await this.prisma.searchHistory.create({
      data: {
        shopId,
        customerId,
        query: dto.query
      }
    });
    return { status: 'added', query: dto.query };
  }

  async getSearchHistory(customerId: string) {
    const shopId = this.getShopId();
    const items = await this.prisma.searchHistory.findMany({
      where: { shopId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return { data: items };
  }

  async createReview(customerId: string, dto: CreateReviewDto) {
    const shopId = this.getShopId();
    
    // Verify if user bought the product and order is DELIVERED
    const hasDeliveredOrder = await this.prisma.order.findFirst({
      where: {
        shopId,
        customerId,
        state: 'delivered',
        lineItems: {
          some: { variant: { productId: dto.productId } }
        }
      }
    });

    if (!hasDeliveredOrder) {
       throw new BadRequestException('You can only review products from delivered orders');
    }

    const review = await this.prisma.productReview.create({
      data: {
        shopId,
        customerId,
        productId: dto.productId,
        orderId: hasDeliveredOrder.id,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: 'published'
      }
    });
    
    return { status: 'created', review };
  }

  async getReviews(query: GetReviewsDto) {
    const shopId = this.getShopId();
    const { productId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId, status: 'published' };
    if (productId) where.productId = productId;

    const [items, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.productReview.count({ where })
    ]);

    return { 
      data: items, 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    };
  }
}

