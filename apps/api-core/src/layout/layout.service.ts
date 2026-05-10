import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GlobalLayout, PageLayout } from '@ecommerce/database';
import { mergeGlobalLayouts, mergePageLayouts } from './merger.utils';
import { MinioService } from '../storage/minio.service';
import {
  StandardTemplate,
} from '@ecommerce/master-templates';
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
  ) {}

  private async checkAuth(ownerId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop)
      throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Shop not found', HttpStatus.NOT_FOUND);
    if (shop.ownerId !== ownerId)
      throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);
    return shop;
  }

  async publishGlobalLayout(
    ownerId: string,
    shopId: string,
    tenantDelta: ShopGlobalLayout,
  ): Promise<BaseResponseDto<any>> {
    try {
      await this.checkAuth(ownerId, shopId);

      // In the future, resolve Master Global Template here. Using an empty/default one for now.
      const masterTemplate: ShopGlobalLayout = {
        isMaster: true,
        templateType: tenantDelta.templateType || 'standard',
        globalComponents: [],
        theme: {}
      };

      const finalLayout = mergeGlobalLayouts(masterTemplate, tenantDelta);

      await GlobalLayout.updateOne(
        { shopId },
        { $set: { publishedData: tenantDelta, lastPublishedAt: new Date() } },
        { upsert: true },
      );

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
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

      // In the future, resolve Master Page Template here.
      const masterTemplate: ShopPageLayout = {
        isMaster: true,
        pageType: pageType,
        components: []
      };

      const finalLayout = mergePageLayouts(masterTemplate, tenantDelta);

      await PageLayout.updateOne(
        { shopId, pageType, slug: tenantDelta.slug || null },
        { $set: { publishedData: tenantDelta, lastPublishedAt: new Date() } },
        { upsert: true },
      );

      return BaseResponseDto.success({ published: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Exception error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getGlobalLayout(shopId: string): Promise<BaseResponseDto<any>> {
    const layout = await GlobalLayout.findOne({ shopId });
    if (!layout) {
      return BaseResponseDto.success(null);
    }
    
    // In production, merge with master again or return cached compiled version
    const masterTemplate: ShopGlobalLayout = { isMaster: true, templateType: 'standard', globalComponents: [], theme: {} };
    const merged = mergeGlobalLayouts(masterTemplate, layout.publishedData as any);
    
    return BaseResponseDto.success(merged);
  }

  async getPageLayout(shopId: string, pageType: PageType, slug?: string): Promise<BaseResponseDto<any>> {
    const query: any = { shopId, pageType };
    if (slug) query.slug = slug;

    const layout = await PageLayout.findOne(query);
    if (!layout) {
      return BaseResponseDto.success(null);
    }

    const masterTemplate: ShopPageLayout = { isMaster: true, pageType, components: [] };
    const merged = mergePageLayouts(masterTemplate, layout.publishedData as any);

    return BaseResponseDto.success(merged);
  }

  async getGlobalLayoutByDomain(domain: string): Promise<BaseResponseDto<any>> {
    const shop = await this.prisma.shop.findUnique({ where: { domain }, select: { id: true } });
    if (!shop) throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Domain is not exist.', HttpStatus.NOT_FOUND);
    return this.getGlobalLayout(shop.id);
  }
}
