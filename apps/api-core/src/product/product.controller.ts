import { Controller, Get, Post, Put, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { ProductService } from './product.service';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CreateProductDto, UpdateProductDto } from './dto/product-zod.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(
    @Session() session: UserSession,
    @Body() dto: CreateProductDto,
  ): Promise<BaseResponseDto<object>> {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.productService.createProduct(session.user.id, dto);
  }

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
      }
    );
  }

  @Get(':id')
  async getProductDetail(@Param('id') id: string): Promise<BaseResponseDto<object>> {
    return this.productService.getProductDetails(id);
  }

  @Put(':id')
  async updateProduct(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<BaseResponseDto<object>> {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.productService.updateProduct(session.user.id, id, dto);
  }
}
