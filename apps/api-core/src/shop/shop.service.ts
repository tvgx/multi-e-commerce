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
import { ShopTemplate } from '@ecommerce/database';
import { CreateShopDto, UpdateShopDto, RegisterTenantDto } from './dto/shop-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { TenantService } from '../common/services/tenant.service';
import { DomainVerifyService } from './domain-verify.service';

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
  ) {}

  // UC-01: Tenant Registration
  async registerTenant(
    dto: RegisterTenantDto,
  ): Promise<BaseResponseDto<object>> {
    try {
      const normalizedDomain = dto.domain.trim().toLowerCase();

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
          templateType: 'standard',
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
        // Keep Mongo initialization best-effort only; registration success is driven by Postgres writes.
        const template = new ShopTemplate({
          shopId: shop.id,
          publishedData: {
            shopId: shop.id,
            templateType: shop.templateType,
            pages: { home: [] },
            metadata: {},
          },
          draftData: {},
        });
        await template.save();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `[registerTenant] Failed to initialize Mongo ShopTemplate for shop ${shop.id}: ${msg}`,
        );
      }

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
        // Keep Mongo initialization best-effort only; shop creation success is driven by Postgres writes.
        const template = new ShopTemplate({
          shopId: shop.id,
          publishedData: {
            shopId: shop.id,
            templateType: shop.templateType,
            pages: { home: [] },
            metadata: {},
          },
          draftData: {},
        });
        await template.save();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `[createShop] Failed to initialize Mongo ShopTemplate for shop ${shop.id}: ${msg}`,
        );
      }

      return BaseResponseDto.success(shop);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create shop');
    }
  }

  async getOnboardingProgress(shopId: string): Promise<BaseResponseDto<any>> {
    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
      select: {
        onboardingStep: true,
        onboardingStatus: true,
        domain: true,
        domainVerified: true,
      },
    });

    if (!shop) throw new NotFoundException('Shop not found');

    // Real-time check for dynamic steps
    const productCount = await this.prisma.product.count({ where: { shopId } });
    const collectionCount = await this.prisma.collection.count({
      where: { shopId },
    });
    const menuCount = await (this.prisma as any).navigationMenu.count({
      where: { shopId },
    });

    const status = shop.onboardingStatus || {};

    return BaseResponseDto.success({
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
    });
  }

  async completeStep(
    shopId: string,
    step: number,
  ): Promise<BaseResponseDto<any>> {
    const shop = await (this.prisma as any).shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) throw new NotFoundException('Shop not found');

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
      case 7:
        isValid = true; // Placeholders for now
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

    const template = (await ShopTemplate.findOne(
      { shopId: targetId },
      { publishedData: 1, _id: 0 },
    ).lean()) as {
      publishedData?: Record<string, unknown>;
    };

    return BaseResponseDto.success({
      metadata: shop,
      uiStructure: template?.publishedData || null,
    });
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

    return BaseResponseDto.success(shop);
  }
}
