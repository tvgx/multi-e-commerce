import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

export class CreateShopDto {
  name: string;
  domain?: string;
  currency?: string;
  templateType?: string;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async getMyShops(ownerId: string) {
    if (!ownerId) throw new BadRequestException('Owner context is missing');
    return this.prisma.shop.findMany({
      where: { ownerId },
      include: { bankAccount: true },
    });
  }

  async createShop(ownerId: string, dto: CreateShopDto) {
    if (!ownerId) throw new BadRequestException('Owner context is missing');
    const shop = await this.prisma.shop.create({
      data: {
        name: dto.name,
        domain: dto.domain,
        currency: dto.currency || 'VND',
        ownerId,
      },
    });
    // BetterAuthGuard cache danh sách shopIds theo user — xoá để shop mới
    // có hiệu lực ngay thay vì đợi TTL.
    await this.cacheManager.del(`user:${ownerId}:shopIds`).catch(() => undefined);
    return shop;
  }

  async getShopById(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { bankAccount: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async resolveShop(identifier: string) {
    // Try by ID first, then by domain/slug
    const shop = await this.prisma.shop.findFirst({
      where: {
        OR: [
          { id: identifier },
          { domain: identifier },
        ],
      },
      select: { id: true, domain: true, name: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async getShopBootstrapData(identifier: string) {
    const resolved = await this.resolveShop(identifier);
    const shop = await this.prisma.shop.findUnique({
      where: { id: resolved.id },
      include: { bankAccount: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async updateShopById(shopId: string, dto: UpdateShopDto) {
    const existing = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!existing) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({
      where: { id: shopId },
      data: dto,
    });
  }

  async getCurrentShop() {
    const shopId = this.getShopId();
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { bankAccount: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async updateCurrentShop(dto: UpdateShopDto) {
    const shopId = this.getShopId();
    return this.prisma.shop.update({
      where: { id: shopId },
      data: dto,
    });
  }

  async updateBankAccount(dto: UpdateBankDto) {
    const shopId = this.getShopId();
    return this.prisma.shopBankAccount.upsert({
      where: { shopId },
      create: {
        shopId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      },
      update: {
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      },
    });
  }

  async getOnboardingProgress(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        onboardingStep: true,
        onboardingStatus: true,
        domainVerified: true,
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    let productCount = 0;
    let collectionCount = 0;
    let menuCount = 0;

    try {
      productCount = await (this.prisma as any).product.count({ where: { shopId } });
      collectionCount = await (this.prisma as any).collection.count({ where: { shopId } });
      menuCount = await (this.prisma as any).navigationMenu.count({ where: { shopId } });
    } catch (e) {
      // Models might be missing in some schema versions, fail silently
    }

    const status = (shop.onboardingStatus as Record<string, any>) || {};

    return {
      currentStep: shop.onboardingStep,
      steps: {
        step1: { status: 'COMPLETED', label: 'Create Store' },
        step2: { status: productCount > 0 ? 'COMPLETED' : 'PENDING', label: 'Add Products' },
        step3: { status: collectionCount > 0 ? 'COMPLETED' : 'PENDING', label: 'Create Collections' },
        step4: { status: menuCount >= 2 ? 'COMPLETED' : 'PENDING', label: 'Setup Header/Footer' },
        step5: { status: status.step5 || 'PENDING', label: 'Design Homepage' },
        step6: { status: status.step6 || 'PENDING', label: 'Setup Payment' },
        step7: { status: status.step7 || 'PENDING', label: 'Shipping & Tax' },
        step8: { status: shop.domainVerified ? 'COMPLETED' : 'PENDING', label: 'Verify Domain' },
      },
    };
  }

  async completeOnboardingStep(shopId: string, step: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { onboardingStep: true, onboardingStatus: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    const updatedStatus = {
      ...((shop.onboardingStatus as Record<string, any>) || {}),
      [`step${step}`]: 'COMPLETED',
    };

    const updatedShop = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        onboardingStep: Math.max(shop.onboardingStep, step),
        onboardingStatus: updatedStatus,
        status: step === 8 ? 'PUBLISHED' : undefined,
      },
    });

    return updatedShop;
  }
}

