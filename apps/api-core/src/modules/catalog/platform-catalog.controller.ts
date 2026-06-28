import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformCatalogService } from './platform-catalog.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

/**
 * Catalog cấp nền tảng (P1-1) — owner-scoped, route `catalog/platform/*`.
 * Tách khỏi CatalogController (tenant-scoped) vì hoạt động xuyên nhiều shop.
 */
@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('catalog/platform')
export class PlatformCatalogController {
  constructor(private readonly service: PlatformCatalogService) {}

  // Danh sách sản phẩm gộp trên mọi shop của owner (kèm danh sách shop để lọc/phân phối)
  @Get('products')
  async listProducts(
    @Req() req: any,
    @Query() query: any,
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.listAllProducts(req.user?.id, query);
    return BaseResponseDto.success(result);
  }

  // Phân phối (sao chép) một sản phẩm sang nhiều shop đích
  @Post('products/:productId/distribute')
  async distribute(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() body: { targetShopIds?: string[] },
  ): Promise<BaseResponseDto<any>> {
    const result = await this.service.distributeProduct(
      req.user?.id,
      productId,
      body?.targetShopIds || [],
    );
    return BaseResponseDto.success(result);
  }
}
