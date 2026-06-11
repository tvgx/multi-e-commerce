import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { GetProductsDto } from './dto/get-products.dto';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

/**
 * Public catalog routes cho storefront (buyer không đăng nhập).
 *
 * Path khớp với những gì apps/storefront/src/lib/api/storefront.api.ts
 * đang gọi (/api/products/*, /api/collections/*). Chỉ trả sản phẩm
 * PUBLISHED — admin dùng /api/catalog/products/* (có auth) để thấy DRAFT.
 */
@UseGuards(BetterAuthGuard)
@Controller()
export class StorefrontCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('products/shop/:shopId')
  async findShopProducts(@Param('shopId') shopId: string, @Query() query: GetProductsDto) {
    const result = await this.catalogService.findAllProducts({
      ...query,
      shopId,
      status: 'PUBLISHED',
    });
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get('products/slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.catalogService.findProductBySlug(slug);
    if (result?.status && result.status !== 'PUBLISHED') throw new NotFoundException('Product not found');
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get('products/:id')
  async findOne(@Param('id') id: string) {
    const result = await this.catalogService.findOneProduct(id);
    if (result?.status && result.status !== 'PUBLISHED') throw new NotFoundException('Product not found');
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get('collections/:slug')
  async getCollectionBySlug(@Param('slug') slug: string, @Query('shopId') shopId: string) {
    const result = await this.catalogService.getCollectionBySlug(slug, shopId);
    return BaseResponseDto.success(result);
  }
}
