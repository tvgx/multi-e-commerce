import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpStatus,
  UseInterceptors,
  UseGuards,
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

@Controller('api')
@UseGuards(BetterAuthGuard)
export class LayoutController {
  constructor(
    private readonly layoutService: LayoutService,
    private readonly cacheService: SystemCacheService,
  ) {}

  @Public()
  @Get('storefront/:domain/layout')
  @UseInterceptors(CacheInterceptor)
  async getStorefrontLayout(
    @Param('domain') domain: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getLayoutByDomain(domain);
  }

  @Post('layouts/publish')
  async publishLayout(
    @CurrentUser() user: any,
    @Body() payload: any,
  ): Promise<BaseResponseDto<any>> {

    const { shopId, ...layoutData } = payload;
    if (!shopId)
      throw new CustomException(
        ResponseCodes.PARAM_NOT_ENOUGH,
        'Parameter is not enought.',
        HttpStatus.BAD_REQUEST,
      );

    const result = await this.layoutService.publishLayout(
      user.id,
      shopId,
      layoutData,
    );

    // Invalidate Next.js Storefront ISR cache for this specific shop
    await this.cacheService.revalidateStorefront(`layout-${shopId}`);

    return result;
  }

  @Public()
  @Get('layouts/:shopId')
  @UseInterceptors(CacheInterceptor)
  async getCompiledLayout(
    @Param('shopId') shopId: string,
  ): Promise<BaseResponseDto<any>> {
    return this.layoutService.getCompiledLayout(shopId);
  }
}
