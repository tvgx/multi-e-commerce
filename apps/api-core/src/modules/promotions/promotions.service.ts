import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreatePromotionDto, UpdatePromotionDto, ValidatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new BadRequestException('Shop context is missing');
    }
    return shopId;
  }

  async findAll() {
    const shopId = this.getShopId();
    return this.prisma.promotion.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const shopId = this.getShopId();
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, shopId }
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async create(dto: CreatePromotionDto) {
    const shopId = this.getShopId();
    const code = dto.code ? dto.code.toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Check code uniqueness
    const existing = await this.prisma.promotion.findUnique({
      where: { shopId_code: { shopId, code } }
    });
    
    if (existing) {
      throw new BadRequestException('Promotion code already exists');
    }

    return this.prisma.promotion.create({
      data: {
        shopId,
        name: dto.name,
        code,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      }
    });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const shopId = this.getShopId();
    await this.findOne(id); // verify ownership

    // PROMO-1: trước đây chỉ ghi name/description/isActive nên sửa giá trị giảm/
    // loại giảm/ngày/giới hạn bị âm thầm bỏ qua (UI báo "đã lưu" mà không đổi).
    // Chỉ map field nào được gửi (!== undefined) để partial update không xoá field khác.
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.discountType !== undefined ? { discountType: dto.discountType } : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
          : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      }
    });
  }

  async remove(id: string) {
    const shopId = this.getShopId();
    await this.findOne(id);
    return this.prisma.promotion.delete({
      where: { id }
    });
  }

  async validate(dto: ValidatePromotionDto) {
    const shopId = this.getShopId();
    const promotion = await this.prisma.promotion.findUnique({
      where: { shopId_code: { shopId, code: dto.code } }
    });

    if (!promotion || !promotion.isActive) {
      throw new BadRequestException('Invalid or inactive promotion code');
    }

    const now = new Date();
    if (promotion.startsAt && promotion.startsAt > now) {
      throw new BadRequestException('Promotion has not started yet');
    }

    if (promotion.expiresAt && promotion.expiresAt < now) {
      throw new BadRequestException('Promotion has expired');
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    let discountAmount = 0;
    if (promotion.discountType === 'percentage') {
      discountAmount = (dto.orderSubtotal * promotion.discountValue) / 100;
    } else {
      discountAmount = promotion.discountValue;
    }

    return {
      valid: true,
      promotion,
      discountAmount,
      finalTotal: Math.max(0, dto.orderSubtotal - discountAmount)
    };
  }
}
