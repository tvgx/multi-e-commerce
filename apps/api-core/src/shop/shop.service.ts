import {
  Injectable,
  Inject,
  Logger,
  HttpStatus,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LayoutService } from '../layout/layout.service';
import { ProductService } from '../product/product.service';
import { CollectionService } from '../collection/collection.service';
import {
  CreateShopDto,
  UpdateShopDto,
  RegisterTenantDto,
} from './dto/shop-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { TenantService } from '../common/services/tenant.service';
import { DomainVerifyService } from './domain-verify.service';
import { SystemCacheService } from '../system/cache/cache.service';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(DomainVerifyService)
    private readonly domainVerifyService: DomainVerifyService,
    @Inject(LayoutService)
    private readonly layoutService: LayoutService,
    @Inject(ProductService)
    private readonly productService: ProductService,
    @Inject(CollectionService)
    private readonly collectionService: CollectionService,
    @Inject(SystemCacheService)
    private readonly cacheService: SystemCacheService,
  ) {}

  // UC-01: Tenant Registration
  async registerTenant(
    dto: RegisterTenantDto,
  ): Promise<BaseResponseDto<object>> {
    try {
      let normalizedDomain = dto.domain.trim().toLowerCase();
      // Ensure .localhost suffix in development if only a slug is provided
      if (
        !normalizedDomain.includes('.') &&
        process.env.NODE_ENV !== 'production'
      ) {
        normalizedDomain = `${normalizedDomain}.localhost`;
      }

      // 1. Check domain availability
      const existingDomain = await this.prisma.shop.findUnique({
        where: { domain: normalizedDomain },
      });
      if (existingDomain) {
        throw new CustomException(
          ResponseCodes.URL_USER_IS_EXIST,
          'Domain already exists',
          HttpStatus.CONFLICT,
        );
      }

      // 2. Check email uniqueness (search in User table)
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new CustomException(
          ResponseCodes.USER_EXISTED,
          'Email already registered',
          HttpStatus.CONFLICT,
        );
      }

      // 3. Create owner user
      const owner = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.ownerName,
          role: 'OWNER',
        },
      });

      // 4. Create shop with owner
      const shop = await (this.prisma as any).shop.create({
        data: {
          name: dto.shopName,
          domain: normalizedDomain,
          ownerId: owner.id,
          status: 'ACTIVE', // UC-01 spec: "active"
          productsPerPage: 30,
          templateType: dto.template || 'standard',
          onboardingStep: 1,
          onboardingStatus: { step1: 'COMPLETED' } as any,
        },
      });

      // 5. Initialize default Navigation Menus
      await this.prisma.navigationMenu.createMany({
        data: [
          {
            shopId: shop.id,
            handle: 'main-menu',
            title: 'Main Menu',
            items: [
              { title: 'Home', url: '/' },
              { title: 'Catalog', url: '/catalog' },
            ] as any,
          },
          {
            shopId: shop.id,
            handle: 'footer-menu',
            title: 'Footer Menu',
            items: [
              { title: 'Search', url: '/search' },
              { title: 'About us', url: '/pages/about' },
            ] as any,
          },
        ],
      });

      try {
        // Publish layout using LayoutService to generate compiled layout in MinIO and Postgres Cache
        await this.layoutService.publishGlobalLayout(owner.id, shop.id, {
          templateType: shop.templateType,
          globalComponents: [],
          theme: {},
        } as any);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `[registerTenant] Failed to publish layout for shop ${shop.id}: ${msg}`,
        );
      }

      // 6. Seed Demo Products & Collections if requested
      if (dto.seedDemoProducts) {
        try {
          // 6a. Create a demo collection
          const collection = await this.collectionService.createCollection(
            owner.id,
            {
              title: 'Featured Collection',
              slug: 'featured',
              description: 'Our best products selected for you',
              shopId: shop.id,
            },
          );

          const demoProducts = [
            {
              name: `${shop.name} Signature T-Shirt`,
              slug: 'signature-t-shirt',
              description: 'High-quality cotton t-shirt',
              basePrice: 29.99,
              sku: `TSHIRT-${shop.id.substring(0, 5)}`,
              inStock: 100,
            },
            {
              name: `${shop.name} Limited Hoodie`,
              slug: 'limited-hoodie',
              description: 'Keep warm in style',
              basePrice: 59.99,
              sku: `HOODIE-${shop.id.substring(0, 5)}`,
              inStock: 50,
            },
          ];

          for (const dp of demoProducts) {
            // Using productService.createProduct to ensure both Postgres and Mongo are synced
            await this.productService.createProduct(owner.id, {
              ...dp,
              shopId: shop.id,
              status: 'PUBLISHED',
              images: [
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
              ],
              collectionIds: [collection.data.id],
            } as any);
          }
        } catch (error) {
          this.logger.warn(
            `[registerTenant] Failed to seed demo products for shop ${shop.id}: ${error}`,
          );
        }
      }

      // Trigger Next.js Revalidation
      await this.cacheService.revalidateStorefront(`layout-${shop.id}`);

      // 7. Return UC-01 spec-compliant response
      return BaseResponseDto.success({
        tenantId: shop.id,
        shopName: shop.name,
        domain: shop.domain,
        email: dto.email,
        ownerName: dto.ownerName,
        status: 'active',
        createdAt: shop.createdAt,
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;

      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`[registerTenant] Unexpected error: ${msg}`, stack);

      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to register tenant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createShop(
    ownerId: string,
    dto: CreateShopDto,
  ): Promise<BaseResponseDto<object>> {
    try {
      const normalizedDomain = dto.domain?.trim().toLowerCase() || undefined;

      // 1. Check domain availability
      if (normalizedDomain) {
        const existing = await this.prisma.shop.findUnique({
          where: { domain: normalizedDomain },
        });
        if (existing) {
          throw new CustomException(
            ResponseCodes.URL_USER_IS_EXIST,
            "Url User's is exist.",
            HttpStatus.CONFLICT,
          );
        }
      }

      // 2. Create in Postgres
      const shop = await (this.prisma as any).shop.create({
        data: {
          name: dto.name,
          domain: normalizedDomain,
          ownerId: ownerId,
          status: 'DRAFT',
          productsPerPage: dto.productsPerPage ?? 30,
          templateType: dto.templateType ?? 'standard',
          onboardingStep: 1,
          onboardingStatus: { step1: 'COMPLETED' } as any,
        },
      });

      // ... (rest of createShop remains same)
      // 3. Initialize default Navigation Menus
      await this.prisma.navigationMenu.createMany({
        data: [
          {
            shopId: shop.id,
            handle: 'main-menu',
            title: 'Main Menu',
            items: [
              { title: 'Home', url: '/' },
              { title: 'Catalog', url: '/catalog' },
            ] as any,
          },
          {
            shopId: shop.id,
            handle: 'footer-menu',
            title: 'Footer Menu',
            items: [
              { title: 'Search', url: '/search' },
              { title: 'About us', url: '/pages/about' },
            ] as any,
          },
        ],
      });

      try {
        // Publish layout using LayoutService to generate compiled layout in MinIO and Postgres Cache
        await this.layoutService.publishGlobalLayout(ownerId, shop.id, {
          templateType: shop.templateType,
          globalComponents: [],
          theme: {},
        } as any);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `[createShop] Failed to publish layout for shop ${shop.id}: ${msg}`,
        );
      }

      // Trigger Next.js Revalidation
      await this.cacheService.revalidateStorefront(`layout-${shop.id}`);

      return BaseResponseDto.success(shop);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create shop');
    }
  }

  async getOnboardingProgress(
    ownerId: string,
    shopId: string,
  ): Promise<BaseResponseDto<any>> {
    const cacheKey = `onboarding:${shopId}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
      select: {
        ownerId: true,
        onboardingStep: true,
        onboardingStatus: true,
        domain: true,
        domainVerified: true,
      },
    });

    if (!shop) throw new NotFoundException('Shop not found');

    if (shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'không có quyền truy cập tài nguyên',
        HttpStatus.FORBIDDEN,
      );
    }

    // Real-time check for dynamic steps
    const productCount = await this.prisma.product.count({ where: { shopId } });
    const collectionCount = await this.prisma.collection.count({
      where: { shopId },
    });
    const menuCount = await (this.prisma as any).navigationMenu.count({
      where: { shopId },
    });

    const status = shop.onboardingStatus || {};

    const onboardingData = {
      currentStep: shop.onboardingStep,
      steps: {
        step1: { status: 'COMPLETED', label: 'Create Store' },
        step2: {
          status: productCount > 0 ? 'COMPLETED' : 'PENDING',
          label: 'Add Products',
        },
        step3: {
          status: collectionCount > 0 ? 'COMPLETED' : 'PENDING',
          label: 'Create Collections',
        },
        step4: {
          status: menuCount >= 2 ? 'COMPLETED' : 'PENDING',
          label: 'Setup Header/Footer',
        },
        step5: { status: status.step5 || 'PENDING', label: 'Design Homepage' },
        step6: { status: status.step6 || 'PENDING', label: 'Setup Payment' },
        step7: { status: status.step7 || 'PENDING', label: 'Shipping & Tax' },
        step8: {
          status: shop.domainVerified ? 'COMPLETED' : 'PENDING',
          label: 'Verify Domain',
        },
      },
    };

    // Cache onboarding data for 1 minute
    await this.cacheService.set(cacheKey, onboardingData, 60000);

    return BaseResponseDto.success(onboardingData);
  }

  async completeStep(
    ownerId: string,
    shopId: string,
    step: number,
  ): Promise<BaseResponseDto<any>> {
    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) throw new NotFoundException('Shop not found');

    if (shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'không có quyền truy cập tài nguyên',
        HttpStatus.FORBIDDEN,
      );
    }

    // 1. Strict sequence check
    if (step !== shop.onboardingStep + 1 && step !== shop.onboardingStep) {
      throw new ForbiddenException(
        `You must complete step ${shop.onboardingStep} first.`,
      );
    }

    // 2. Step specific validation
    let isValid = false;
    switch (step) {
      case 2:
        isValid = (await this.prisma.product.count({ where: { shopId } })) > 0;
        break;
      case 3:
        isValid =
          (await this.prisma.collection.count({ where: { shopId } })) > 0;
        break;
      case 4:
        isValid =
          (await this.prisma.navigationMenu.count({ where: { shopId } })) >= 2;
        break;
      case 5:
        isValid = true; // Homepage design always has a default after step 1
        break;
      case 6:
        const bankInfo = shop.bankAccount;
        isValid = !!(
          bankInfo?.bankName &&
          bankInfo?.accountNumber &&
          bankInfo?.accountHolder
        );
        if (isValid) {
          // Initialize default payment methods for this shop
          await (this.prisma as any).paymentMethod.upsert({
            where: { shopId_type: { shopId, type: 'QRPAY' } },
            update: { active: true },
            create: {
              shopId,
              type: 'QRPAY',
              name: 'Chuyển khoản QR (QRPAY)',
              description: 'Thanh toán quét mã QR qua ứng dụng ngân hàng',
              active: true,
            },
          });
          await (this.prisma as any).paymentMethod.upsert({
            where: { shopId_type: { shopId, type: 'COD' } },
            update: { active: true },
            create: {
              shopId,
              type: 'COD',
              name: 'Thanh toán khi nhận hàng (COD)',
              description: 'Thanh toán tiền mặt khi shipper giao hàng tới',
              active: true,
            },
          });
        }
        break;
      case 7:
        isValid = true; // Placeholder for shipping & tax
        break;
      case 8:
        if (!shop.domain)
          throw new CustomException(
            ResponseCodes.PARAM_VALUE_INVALID,
            'Domain not set',
            HttpStatus.BAD_REQUEST,
          );
        isValid = await this.domainVerifyService.verifyDNS(shop.domain, shopId);
        if (isValid) {
          await (this.prisma as any).shop.update({
            where: { id: shopId },
            data: { domainVerified: true },
          });
        }
        break;
      default:
        throw new CustomException(
          ResponseCodes.PARAM_VALUE_INVALID,
          'Invalid step',
          HttpStatus.BAD_REQUEST,
        );
    }

    if (!isValid) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        `Step ${step} validation failed.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Update status
    const updatedStatus = {
      ...(shop.onboardingStatus || {}),
      [`step${step}`]: 'COMPLETED',
    };
    const updatedShop = await (this.prisma as any).shop.update({
      where: { id: shopId },
      data: {
        onboardingStep: Math.max(shop.onboardingStep, step),
        onboardingStatus: updatedStatus,
        status: step === 8 ? 'PUBLISHED' : 'DRAFT',
      },
    });

    // Invalidate onboarding cache
    await this.cacheService.del(`onboarding:${shopId}`);
    if (step === 8) {
      await this.cacheService.revalidateStorefront(`layout-${shopId}`);
    }

    return BaseResponseDto.success(updatedShop);
  }

  // ... (rest of the shop methods)
  async updateShop(
    ownerId: string,
    shopId: string,
    dto: UpdateShopDto,
  ): Promise<BaseResponseDto<object>> {
    try {
      const currentShopId = this.tenantService.getTenantId();
      const targetId = shopId || currentShopId;

      if (!targetId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Tenant identity unknown',
          HttpStatus.BAD_REQUEST,
        );
      }

      const shop = await this.prisma.shop.findUnique({
        where: { id: targetId },
      });
      if (!shop)
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'No Data or end of list data',
          HttpStatus.NOT_FOUND,
        );

      if (shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'không có quyền truy cập tài nguyên',
          HttpStatus.FORBIDDEN,
        );
      }

      const normalizedDomain = dto.domain?.trim().toLowerCase();

      const updated = await this.prisma.shop.update({
        where: { id: targetId },
        data: {
          ...dto,
          ...(dto.domain !== undefined
            ? { domain: normalizedDomain || null }
            : {}),
        },
      });

      // Invalidate caches
      await this.cacheService.del(`shop-settings:${targetId}`);
      await this.cacheService.del(`shop-resolve:${targetId}`);
      if (shop.domain)
        await this.cacheService.del(
          `shop-resolve:${shop.domain.toLowerCase()}`,
        );
      if (normalizedDomain)
        await this.cacheService.del(`shop-resolve:${normalizedDomain}`);

      await this.cacheService.revalidateStorefront(`layout-${targetId}`);

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update shop');
    }
  }

  async getShopSettings(shopId: string): Promise<BaseResponseDto<object>> {
    const currentShopId = this.tenantService.getTenantId();
    const targetId = shopId || currentShopId;

    if (!targetId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cacheKey = `shop-settings:${targetId}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    const shop = await this.prisma.shop.findUnique({
      where: { id: targetId },
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!shop) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'No Data or end of list data',
        HttpStatus.NOT_FOUND,
      );
    }

    const layoutRes = await this.layoutService.getGlobalLayout(targetId);
    const uiStructure = layoutRes.data;

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { shopId: targetId, active: true },
    });

    const result = {
      metadata: shop,
      uiStructure,
      paymentMethods,
    };

    await this.cacheService.set(cacheKey, result, 300000); // 5 minutes cache

    return BaseResponseDto.success(result);
  }

  async getMyShops(ownerId: string): Promise<BaseResponseDto<any>> {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
    });
    return BaseResponseDto.success(shops);
  }

  async getAllShops(): Promise<BaseResponseDto<any>> {
    const shops = await this.prisma.shop.findMany({
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
    });
    return BaseResponseDto.success(shops);
  }

  async resolveShop(identifier: string): Promise<BaseResponseDto<object>> {
    const normalized = identifier.trim().toLowerCase();
    const cacheKey = `shop-resolve:${normalized}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    const shop = await this.prisma.shop.findFirst({
      where: {
        OR: [{ id: identifier }, { domain: normalized }],
      },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        ownerId: true,
        productsPerPage: true,
        templateType: true,
      },
    });

    if (!shop) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'No Data or end of list data',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cacheService.set(cacheKey, shop, 600000); // 10 minutes cache
    return BaseResponseDto.success(shop);
  }
}
