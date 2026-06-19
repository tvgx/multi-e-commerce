import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { ToggleWishlistDto, AddSearchHistoryDto, CreateReviewDto, UpdateReviewDto, GetReviewsDto, GetAdminReviewsDto, UpdateReviewStatusDto, REVIEW_STATUSES } from './dto/interactions.dto';

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
    if (items.length === 0) return { data: [] };

    // WishlistItem không có relation Prisma tới Product (chỉ lưu productId),
    // nên join thủ công bằng một query `in` — UI cần render card sản phẩm,
    // tránh để client gọi N request chi tiết sản phẩm
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, shopId },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        status: true,
        variants: {
          where: { isMaster: true },
          select: { price: true, currency: true },
          take: 1,
        },
      },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    return {
      data: items.map((item) => ({
        ...item,
        product: productById.get(item.productId) ?? null,
      })),
    };
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
    
    // Verify the user bought the product on a fulfilled order. Admin chuyển đơn
    // delivered → completed nên cả hai state đều cho phép review (nếu chỉ chấp
    // nhận 'delivered' thì khách mất quyền review ngay khi đơn hoàn tất).
    const fulfilledOrder = await this.prisma.order.findFirst({
      where: {
        shopId,
        customerId,
        state: { in: ['delivered', 'completed'] },
        lineItems: {
          some: { variant: { productId: dto.productId } }
        }
      }
    });

    if (!fulfilledOrder) {
       throw new BadRequestException('You can only review products from delivered orders');
    }

    // Chặn review trùng: mỗi khách chỉ review 1 lần / sản phẩm (không có unique
    // index nên guard tay; muốn sửa review thì dùng updateReview).
    const existingReview = await this.prisma.productReview.findFirst({
      where: { shopId, customerId, productId: dto.productId },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = await this.prisma.productReview.create({
      data: {
        shopId,
        customerId,
        productId: dto.productId,
        orderId: fulfilledOrder.id,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: 'published'
      }
    });
    
    return { status: 'created', review };
  }

  async updateReview(customerId: string, id: string, dto: UpdateReviewDto) {
    const shopId = this.getShopId();
    const existing = await this.prisma.productReview.findFirst({
      where: { id, shopId, customerId },
    });
    if (!existing) throw new NotFoundException('Review not found');

    const review = await this.prisma.productReview.update({
      where: { id },
      data: {
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
      },
    });
    return { status: 'updated', review };
  }

  async deleteReview(customerId: string, id: string) {
    const shopId = this.getShopId();
    const existing = await this.prisma.productReview.findFirst({
      where: { id, shopId, customerId },
    });
    if (!existing) throw new NotFoundException('Review not found');

    await this.prisma.productReview.delete({ where: { id } });
    return { status: 'deleted', id };
  }

  async clearSearchHistory(customerId: string) {
    const shopId = this.getShopId();
    const { count } = await this.prisma.searchHistory.deleteMany({
      where: { shopId, customerId },
    });
    return { status: 'cleared', count };
  }

  async removeWishlistItem(customerId: string, productId: string) {
    const shopId = this.getShopId();
    const { count } = await this.prisma.wishlistItem.deleteMany({
      where: { shopId, customerId, productId },
    });
    if (count === 0) throw new NotFoundException('Wishlist item not found');
    return { status: 'removed', productId };
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

  /** Seller: liệt kê review của shop, mọi trạng thái — phục vụ moderation. */
  async getAdminReviews(query: GetAdminReviewsDto) {
    const shopId = this.getShopId();
    const { productId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (productId) where.productId = productId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    // Review không có FK Prisma tới Product/Customer — join thủ công như wishlist
    const [products, customers] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: [...new Set(items.map((r) => r.productId))] }, shopId },
        select: { id: true, name: true, slug: true, imageUrl: true },
      }),
      this.prisma.customer.findMany({
        where: { id: { in: [...new Set(items.map((r) => r.customerId))] }, shopId },
        select: { id: true, name: true, email: true },
      }),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));
    const customerById = new Map(customers.map((c) => [c.id, c]));

    return {
      data: items.map((review) => ({
        ...review,
        product: productById.get(review.productId) ?? null,
        customer: customerById.get(review.customerId) ?? null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Seller: ẩn / công khai / đưa về pending một review. */
  async updateReviewStatus(id: string, dto: UpdateReviewStatusDto) {
    const shopId = this.getShopId();
    // App không bật global ValidationPipe nên @IsIn trong DTO không chạy — check tay
    if (!REVIEW_STATUSES.includes(dto.status as any)) {
      throw new BadRequestException(`Status must be one of: ${REVIEW_STATUSES.join(', ')}`);
    }
    const existing = await this.prisma.productReview.findFirst({
      where: { id, shopId },
    });
    if (!existing) throw new NotFoundException('Review not found');

    const review = await this.prisma.productReview.update({
      where: { id },
      data: { status: dto.status },
    });
    return { status: 'updated', review };
  }
}

