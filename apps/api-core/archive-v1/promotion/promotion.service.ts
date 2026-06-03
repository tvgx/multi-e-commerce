import { Injectable, HttpStatus, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class PromotionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  /**
   * Tạo chiến dịch khuyến mại mới
   */
  async createPromotion(ownerId: string, dto: CreatePromotionDto) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xác nhận quyền sở hữu Shop
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Unauthorized to create promotions for this shop',
        HttpStatus.FORBIDDEN,
      );
    }

    // Kiểm tra trùng mã code trong cùng một shop
    const existing = await this.prisma.promotion.findFirst({
      where: {
        shopId,
        code: dto.code.toUpperCase(),
      },
    });

    if (existing) {
      throw new BadRequestException(`Promotion code "${dto.code}" already exists for this shop`);
    }

    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        code: dto.code.toUpperCase(),
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        shopId,
      },
    });
  }

  /**
   * Lấy danh sách khuyến mại của shop
   */
  async getAllPromotions(shopId?: string) {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.promotion.findMany({
      where: { shopId: targetShopId },
      orderBy: { createdAt: 'desc' as any },
    });
  }

  /**
   * Cập nhật thông tin chiến dịch
   */
  async updatePromotion(ownerId: string, id: string, dto: UpdatePromotionDto) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!promotion) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Promotion not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (promotion.shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Unauthorized to modify this promotion',
        HttpStatus.FORBIDDEN,
      );
    }

    if (dto.code) {
      const existing = await this.prisma.promotion.findFirst({
        where: {
          shopId,
          code: dto.code.toUpperCase(),
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(`Promotion code "${dto.code}" already exists for this shop`);
      }
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        usageLimit: dto.usageLimit,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
      },
    });
  }

  /**
   * Xác thực tính hợp lệ của mã giảm giá và tính toán số tiền chiết khấu
   */
  async validatePromotion(
    shopId: string,
    code: string,
    itemTotal: number,
    txClient?: any,
  ): Promise<{ promotionId: string; discountAmount: number }> {
    const client = txClient || this.prisma;
    const normalizedCode = code.trim().toUpperCase();

    const promotion = await client.promotion.findFirst({
      where: {
        shopId,
        code: normalizedCode,
      },
    });

    if (!promotion) {
      throw new BadRequestException(`Promotion code "${code}" is invalid`);
    }

    if (!promotion.isActive) {
      throw new BadRequestException(`Promotion code "${code}" is no longer active`);
    }

    const now = new Date();
    if (promotion.startsAt && now < promotion.startsAt) {
      throw new BadRequestException(`Promotion campaign has not started yet`);
    }

    if (promotion.expiresAt && now > promotion.expiresAt) {
      throw new BadRequestException(`Promotion campaign has expired`);
    }

    if (promotion.usageLimit !== null && promotion.usageLimit !== undefined) {
      if (promotion.usedCount >= promotion.usageLimit) {
        throw new BadRequestException(`Promotion code "${code}" has reached its usage limit`);
      }
    }

    // Tính toán số tiền chiết khấu
    let discountAmount = 0;
    if (promotion.discountType === 'PERCENTAGE') {
      discountAmount = itemTotal * (promotion.discountValue / 100);
    } else if (promotion.discountType === 'FIXED_AMOUNT') {
      discountAmount = promotion.discountValue;
    }

    // Số tiền giảm không được vượt quá tổng tiền hàng
    if (discountAmount > itemTotal) {
      discountAmount = itemTotal;
    }

    return {
      promotionId: promotion.id,
      discountAmount: Math.round(discountAmount),
    };
  }
}
