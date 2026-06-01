import { Injectable, HttpStatus, Logger, Inject } from '@nestjs/common';
import { SystemCacheService } from '../system/cache/cache.service';
import { PrismaService } from '../database/prisma.service';
import { GlobalLayout, PageLayout } from '@ecommerce/database';
import { MinioService } from '../storage/minio.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { ShopGlobalLayout, ShopPageLayout, PageType } from '@ecommerce/schema';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
    @Inject(SystemCacheService)
    private readonly cacheService: SystemCacheService,
  ) {}

  private async checkAuth(ownerId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop)
      throw new CustomException(
        ResponseCodes.URL_USER_IS_EXIST,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    if (shop.ownerId !== ownerId)
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );
    return shop;
  }

  async publishGlobalLayout(
    ownerId: string,
    shopId: string,
    tenantDelta: ShopGlobalLayout,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      await GlobalLayout.updateOne(
        { shopId },
        { $set: { publishedData: tenantDelta, lastPublishedAt: new Date() } },
        { upsert: true },
      );

      // Invalidate Redis cache - Next fetch will re-merge on the fly
      await this.cacheService.del(`layout:global:${shopId}`);

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Exception error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publishPageLayout(
    ownerId: string,
    shopId: string,
    pageType: PageType,
    tenantDelta: ShopPageLayout,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      await PageLayout.updateOne(
        { shopId, pageType, slug: tenantDelta.slug || null },
        { $set: { publishedData: tenantDelta, lastPublishedAt: new Date() } },
        { upsert: true },
      );

      // Invalidate Redis cache for page layout
      const cacheKey = `layout:page:${shopId}:${pageType}${tenantDelta.slug ? ':' + tenantDelta.slug : ''}`;
      await this.cacheService.del(cacheKey);

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Exception error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGlobalLayout(shopId: string): Promise<BaseResponseDto<any>> {
    const cacheKey = `layout:global:${shopId}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    // 1. Fetch from MongoDB
    const layout = await GlobalLayout.findOne({ shopId });
    if (!layout) {
      return BaseResponseDto.success(null);
    }

    // 3. Cache version in Redis (Persistent enough for performance)
    await this.cacheService.set(cacheKey, layout.publishedData, 3600000); // 1 hour Redis cache
    
    return BaseResponseDto.success(layout.publishedData);
  }

  async getPageLayout(
    shopId: string,
    pageType: PageType,
    slug?: string,
  ): Promise<BaseResponseDto<any>> {
    const cacheKey = `layout:page:${shopId}:${pageType}${slug ? ':' + slug : ''}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    const query: any = { shopId, pageType };
    if (slug) query.slug = slug;

    const layout = await PageLayout.findOne(query);
    if (!layout) {
      return BaseResponseDto.success(null);
    }

    await this.cacheService.set(cacheKey, layout.publishedData, 3600000);
    return BaseResponseDto.success(layout.publishedData);
  }

  async getGlobalLayoutByDomain(domain: string): Promise<BaseResponseDto<any>> {
    const cacheKey = `domain-shop-id:${domain.toLowerCase()}`;
    const cachedShopId = await this.cacheService.get<string>(cacheKey);

    if (cachedShopId) {
      return this.getGlobalLayout(cachedShopId);
    }

    const shop = await this.prisma.shop.findUnique({
      where: { domain: domain.toLowerCase() },
      select: { id: true },
    });
    if (!shop)
      throw new CustomException(
        ResponseCodes.URL_USER_IS_EXIST,
        'Domain is not exist.',
        HttpStatus.NOT_FOUND,
      );

    await this.cacheService.set(cacheKey, shop.id, 3600000); // 1 hour cache for mapping
    return this.getGlobalLayout(shop.id);
  }

  async saveGlobalLayoutDraft(
    ownerId: string,
    shopId: string,
    tenantDelta: ShopGlobalLayout,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      await GlobalLayout.updateOne(
        { shopId },
        { $set: { draftData: tenantDelta } },
        { upsert: true },
      );

      return BaseResponseDto.success({ saved: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to save global layout draft.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publishGlobalLayoutDraft(
    ownerId: string,
    shopId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      const layout = await GlobalLayout.findOne({ shopId });
      if (!layout || !layout.draftData || Object.keys(layout.draftData).length === 0) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'No draft data to publish.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await GlobalLayout.updateOne(
        { shopId },
        { $set: { publishedData: layout.draftData, lastPublishedAt: new Date() } },
      );

      // Invalidate Redis cache
      await this.cacheService.del(`layout:global:${shopId}`);

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to publish global layout draft.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGlobalLayoutDraft(shopId: string): Promise<BaseResponseDto<any>> {
    const layout = await GlobalLayout.findOne({ shopId });
    if (!layout) {
      return BaseResponseDto.success(null);
    }

    const draft = layout.draftData && Object.keys(layout.draftData).length > 0
      ? layout.draftData
      : layout.publishedData;

    return BaseResponseDto.success(draft);
  }

  async savePageLayoutDraft(
    ownerId: string,
    shopId: string,
    pageType: PageType,
    tenantDelta: ShopPageLayout,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      await PageLayout.updateOne(
        { shopId, pageType, slug: tenantDelta.slug || null },
        { $set: { draftData: tenantDelta } },
        { upsert: true },
      );

      return BaseResponseDto.success({ saved: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to save page layout draft.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publishPageLayoutDraft(
    ownerId: string,
    shopId: string,
    pageType: PageType,
    slug?: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      const query: any = { shopId, pageType };
      if (slug) query.slug = slug;

      const layout = await PageLayout.findOne(query);
      if (!layout || !layout.draftData || Object.keys(layout.draftData).length === 0) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'No draft data to publish.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await PageLayout.updateOne(
        query,
        { $set: { publishedData: layout.draftData, lastPublishedAt: new Date() } },
      );

      // Invalidate Redis cache for page layout
      const cacheKey = `layout:page:${shopId}:${pageType}${slug ? ':' + slug : ''}`;
      await this.cacheService.del(cacheKey);

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to publish page layout draft.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPageLayoutDraft(
    shopId: string,
    pageType: PageType,
    slug?: string,
  ): Promise<BaseResponseDto<any>> {
    const query: any = { shopId, pageType };
    if (slug) query.slug = slug;

    const layout = await PageLayout.findOne(query);
    if (!layout) {
      return BaseResponseDto.success(null);
    }

    const draft = layout.draftData && Object.keys(layout.draftData).length > 0
      ? layout.draftData
      : layout.publishedData;

    return BaseResponseDto.success(draft);
  }
}
