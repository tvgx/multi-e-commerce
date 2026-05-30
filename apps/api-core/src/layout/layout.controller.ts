import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  UseInterceptors,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { LayoutService } from './layout.service';
import { SystemCacheService } from '../system/cache/cache.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';
import type { PageType } from '@ecommerce/schema';

@Controller()
@UseGuards(BetterAuthGuard)
export class LayoutController {
  constructor(
    private readonly layoutService: LayoutService,
    private readonly cacheService: SystemCacheService,
  ) {}

  @Public()
  @Get('storefront/:domain/layout/global')
  @UseInterceptors(CacheInterceptor)
  async getStorefrontGlobalLayout(
    @Param('domain') domain: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getGlobalLayoutByDomain(domain);
  }

  @Post('layouts/publish/global')
  async publishGlobalLayout(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId, ...layoutData } = payload;
    if (!shopId)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'Parameter is not enough.',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.layoutService.publishGlobalLayout(
      user.id,
      shopId,
      layoutData,
    );
    await this.cacheService.revalidateStorefront(`layout-${shopId}-global`);
    return result;
  }

  @Post('layouts/publish/page')
  async publishPageLayout(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId, pageType, ...layoutData } = payload;
    if (!shopId || !pageType)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'shopId and pageType are required.',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.layoutService.publishPageLayout(
      user.id,
      shopId,
      pageType,
      layoutData,
    );
    await this.cacheService.revalidateStorefront(
      `layout-${shopId}-page-${pageType}`,
    );
    return result;
  }

  @Public()
  @Get('layouts/:shopId/global')
  @UseInterceptors(CacheInterceptor)
  async getGlobalLayout(
    @Param('shopId') shopId: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getGlobalLayout(shopId);
  }

  @Public()
  @Get('layouts/:shopId/page/:pageType')
  @UseInterceptors(CacheInterceptor)
  async getPageLayout(
    @Param('shopId') shopId: string,
    @Param('pageType') pageType: PageType,
    @Query('slug') slug?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getPageLayout(shopId, pageType, slug);
  }

  @Post('layouts/draft/global')
  async saveGlobalLayoutDraft(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId, ...layoutData } = payload;
    if (!shopId)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'Parameter is not enough.',
        HttpStatus.BAD_REQUEST,
      );

    return this.layoutService.saveGlobalLayoutDraft(
      user.id,
      shopId,
      layoutData,
    );
  }

  @Post('layouts/publish-draft/global')
  async publishGlobalLayoutDraft(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId } = payload;
    if (!shopId)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'shopId is required.',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.layoutService.publishGlobalLayoutDraft(
      user.id,
      shopId,
    );
    await this.cacheService.revalidateStorefront(`layout-${shopId}-global`);
    return result;
  }

  @Get('layouts/:shopId/global/draft')
  async getGlobalLayoutDraft(
    @Param('shopId') shopId: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getGlobalLayoutDraft(shopId);
  }

  @Post('layouts/draft/page')
  async savePageLayoutDraft(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId, pageType, ...layoutData } = payload;
    if (!shopId || !pageType)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'shopId and pageType are required.',
        HttpStatus.BAD_REQUEST,
      );

    return this.layoutService.savePageLayoutDraft(
      user.id,
      shopId,
      pageType,
      layoutData,
    );
  }

  @Post('layouts/publish-draft/page')
  async publishPageLayoutDraft(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {
    const { shopId, pageType, slug } = payload;
    if (!shopId || !pageType)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'shopId and pageType are required.',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.layoutService.publishPageLayoutDraft(
      user.id,
      shopId,
      pageType,
      slug,
    );
    await this.cacheService.revalidateStorefront(
      `layout-${shopId}-page-${pageType}`,
    );
    return result;
  }

  @Get('layouts/:shopId/page/:pageType/draft')
  async getPageLayoutDraft(
    @Param('shopId') shopId: string,
    @Param('pageType') pageType: PageType,
    @Query('slug') slug?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getPageLayoutDraft(shopId, pageType, slug);
  }
}
