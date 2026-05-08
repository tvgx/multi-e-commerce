import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('api/products')
@UseGuards(BetterAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(
    @CurrentUser() user: any,
    @Body() dto: CreateProductDto,
  ): Promise<BaseResponseDto<object>> {
    return this.productService.createProduct(user.id, dto);
  }

  @Public()
  @Get('shop/:shopId')
  async getShopProducts(
    @Param('shopId') shopId: string,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ): Promise<BaseResponseDto<object[]>> {
    return this.productService.getProductsByShop(
      shopId,
      limit ? Number(limit) : 20,
      {
        search,
        categoryId,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      },
    );
  }

  @Public()
  @Get(':id')
  async getProductDetail(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<object>> {
    return this.productService.getProductDetails(id);
  }

  @Put(':id')
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<BaseResponseDto<object>> {
    return this.productService.updateProduct(user.id, id, dto);
  }
}
