import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { resolveTxt } from 'dns/promises';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdatePaymentMethodsDto } from './dto/update-payment-methods.dto';

export class CreateShopDto {
  name: string;
  domain?: string;
  currency?: string;
  templateType?: string;
}

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

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
      include: { 
        bankAccount: true,
        stockLocations: { where: { isDefault: true } }
      },
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

  // ─── Custom domain (P0-2: xác thực thật qua bản ghi TXT) ──────────────

  /** Giá trị bản ghi TXT người bán phải thêm để chứng minh sở hữu tên miền. */
  private domainVerificationValue(shopId: string): string {
    return `shopVolo-verification=${shopId}`;
  }

  /** Chuẩn hoá + validate tên miền (không có ValidationPipe nên làm tay). */
  private normalizeCustomDomain(raw: string): string {
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException('Tên miền không hợp lệ');
    }
    const host = raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '') // bỏ scheme
      .replace(/\/.*$/, '') // bỏ path
      .replace(/:\d+$/, ''); // bỏ port
    // hostname hợp lệ: nhiều nhãn, TLD ≥ 2 ký tự, tổng ≤ 253
    const valid =
      /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
        host,
      );
    if (!valid) {
      throw new BadRequestException(
        'Tên miền không hợp lệ (ví dụ hợp lệ: store.example.com)',
      );
    }
    // Chặn tên miền của chính nền tảng
    const platformHosts = (
      process.env.PLATFORM_HOSTS || 'localhost,omnicommerce.com,tvgx1.id.vn'
    )
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (platformHosts.some((ph) => host === ph || host.endsWith(`.${ph}`))) {
      throw new BadRequestException(
        'Không thể dùng tên miền của nền tảng làm tên miền riêng',
      );
    }
    return host;
  }

  /** Lưu tên miền riêng người bán muốn dùng; reset trạng thái xác thực. */
  async setCustomDomain(shopId: string, rawDomain: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    const host = this.normalizeCustomDomain(rawDomain);

    const taken = await this.prisma.shop.findFirst({
      where: { customDomain: host, NOT: { id: shopId } },
      select: { id: true },
    });
    if (taken) {
      throw new BadRequestException(
        'Tên miền này đã được một cửa hàng khác sử dụng',
      );
    }

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { customDomain: host, domainVerified: false },
      select: { id: true, customDomain: true, domainVerified: true },
    });

    return {
      ...updated,
      verification: {
        type: 'TXT',
        host: '@',
        value: this.domainVerificationValue(shopId),
      },
    };
  }

  /**
   * Xác thực THẬT: resolve bản ghi TXT của customDomain và so khớp giá trị xác
   * thực. Khớp → đánh dấu domainVerified = true. (Thay cho hành vi cosmetic cũ.)
   */
  async verifyCustomDomain(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, customDomain: true, domainVerified: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    if (!shop.customDomain) {
      throw new BadRequestException(
        'Chưa cấu hình tên miền riêng cho cửa hàng này',
      );
    }

    const expected = this.domainVerificationValue(shopId);
    let records: string[][] = [];
    try {
      records = await resolveTxt(shop.customDomain);
    } catch (err) {
      // ENOTFOUND / ENODATA: chưa có bản ghi TXT nào
      this.logger.warn(
        `TXT lookup failed for ${shop.customDomain}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        'Chưa tìm thấy bản ghi TXT cho tên miền. DNS có thể cần tới 24-48 giờ để cập nhật — vui lòng thử lại sau.',
      );
    }

    // Mỗi TXT record là một mảng các chunk; nối lại rồi so khớp.
    const matched = records
      .map((parts) => parts.join('').trim())
      .some((value) => value === expected);

    if (!matched) {
      throw new BadRequestException(
        'Bản ghi TXT chưa khớp giá trị xác thực. Hãy kiểm tra lại giá trị đã thêm vào DNS.',
      );
    }

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { domainVerified: true },
      select: { id: true, customDomain: true, domainVerified: true },
    });
    this.logger.log(`Custom domain verified: ${shop.customDomain} → ${shopId}`);
    return updated;
  }

  /**
   * Tra cứu cho storefront middleware: host (tên miền riêng đã xác thực) → slug.
   * Trả null nếu không có shop nào khớp/đã xác thực (host lạ → để 404 bình thường).
   */
  async resolveByHost(host: string) {
    const clean = (host || '').split(':')[0].trim().toLowerCase();
    if (!clean) return null;
    const shop = await this.prisma.shop.findFirst({
      where: { customDomain: clean, domainVerified: true },
      select: { id: true, domain: true },
    });
    if (!shop) return null;
    return { id: shop.id, slug: shop.domain || shop.id };
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

  // Địa chỉ kho hàng mặc định (nơi shipper đến lấy hàng) — upsert StockLocation isDefault.
  async upsertWarehouse(shopId: string, dto: UpdateWarehouseDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (!dto || (!dto.addressLine && !dto.provinceCode && !dto.wardCode)) {
      throw new BadRequestException('Warehouse address is required');
    }

    const data = {
      name: dto.name?.trim() || 'Kho mặc định',
      phone: dto.phone ?? null,
      addressLine: dto.addressLine ?? null,
      provinceCode: dto.provinceCode ?? null,
      wardCode: dto.wardCode ?? null,
      note: dto.note ?? null,
      isDefault: true,
      active: true,
    };

    const existing = await this.prisma.stockLocation.findFirst({
      where: { shopId, isDefault: true },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) {
      return this.prisma.stockLocation.update({ where: { id: existing.id }, data });
    }
    return this.prisma.stockLocation.create({ data: { shopId, ...data } });
  }

  /**
   * Chỉ lấy địa chỉ kho mặc định. Trang cài đặt vận chuyển trước đây phải GET cả shop
   * (kèm bankAccount) chỉ để đọc stockLocations[0] → endpoint này tránh over-fetch đó.
   */
  async getWarehouse(shopId: string) {
    return this.prisma.stockLocation.findFirst({
      where: { shopId, isDefault: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        addressLine: true,
        provinceCode: true,
        wardCode: true,
        note: true,
      },
    });
  }

  // Bật/tắt phương thức thanh toán cơ bản (COD, Chuyển khoản) — upsert theo (shopId, type).
  async setPaymentMethods(shopId: string, dto: UpdatePaymentMethodsDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) throw new NotFoundException('Shop not found');

    const results: any[] = [];
    const upsert = (type: string, name: string, active: boolean) =>
      this.prisma.paymentMethod.upsert({
        where: { shopId_type: { shopId, type } },
        create: { shopId, type, name, active },
        update: { active, name },
      });

    if (dto.cod !== undefined) {
      results.push(await upsert('COD', 'Thanh toán khi nhận hàng (COD)', !!dto.cod));
    }
    if (dto.bankTransfer !== undefined) {
      results.push(await upsert('BankTransfer', 'Chuyển khoản ngân hàng', !!dto.bankTransfer));
    }
    return results;
  }

  async getOnboardingProgress(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        onboardingStep: true,
        onboardingStatus: true,
        domain: true,
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    let productCount = 0;
    let collectionCount = 0;
    let paymentMethodCount = 0;
    let shippingMethodCount = 0;
    let stockLocationCount = 0;

    try {
      productCount = await (this.prisma as any).product.count({ where: { shopId } });
      collectionCount = await (this.prisma as any).collection.count({ where: { shopId } });
      paymentMethodCount = await (this.prisma as any).paymentMethod.count({ where: { shopId, active: true } });
      shippingMethodCount = await (this.prisma as any).shippingMethod.count({ where: { shopId, active: true } });
      stockLocationCount = await (this.prisma as any).stockLocation.count({ where: { shopId, isDefault: true } });
    } catch (e) {
      // Models might be missing in some schema versions, fail silently
    }

    const status = (shop.onboardingStatus as Record<string, any>) || {};

    return {
      currentStep: shop.onboardingStep,
      domain: shop.domain,
      steps: {
        step1: { status: 'COMPLETED', label: 'Create Store' },
        step2: { status: productCount > 0 ? 'COMPLETED' : 'PENDING', label: 'Add Products' },
        step3: { status: collectionCount > 0 ? 'COMPLETED' : 'PENDING', label: 'Add Collections' },
        step4: { status: status.step4 || 'PENDING', label: 'Design UI' },
        step5: { status: paymentMethodCount > 0 ? 'COMPLETED' : 'PENDING', label: 'Setup Payment' },
        step6: { status: (shippingMethodCount > 0 && stockLocationCount > 0) ? 'COMPLETED' : 'PENDING', label: 'Shipping & Tax' },
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
        status: step === 6 ? 'PUBLISHED' : undefined,
      },
    });

    return updatedShop;
  }
}

