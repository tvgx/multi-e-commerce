import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, StreamableFile, Header, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';
import { ProductImportService } from './product-import.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

import { BaseResponseDto } from '../../common/dto/base-response.dto';

@UseGuards(BetterAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly catalogStreamService: CatalogStreamService,
    private readonly productImportService: ProductImportService,
  ) {}

  // --- Bulk import (TODO 9): upload CSV/XLSX, xử lý nền, poll tiến độ ---
  @RequireRoles('ADMIN', 'OWNER')
  @Post('products/import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any) {
    const result = await this.productImportService.startImport(file);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Get('products/import/:jobId')
  async getImportStatus(@Param('jobId') jobId: string) {
    const result = await this.productImportService.getImportStatus(jobId);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Get('export/stream')
  @Header('Content-Type', 'application/jsonl')
  @Header('Content-Disposition', 'attachment; filename="products.jsonl"')
  async exportProductsStream(): Promise<StreamableFile> {
    const stream = await this.catalogStreamService.streamProductsJsonl();
    return new StreamableFile(stream);
  }

  // --- Collection Endpoints ---
  @RequireRoles('ADMIN', 'OWNER')
  @Post('collections')
  async createCollection(@Body() dto: CreateCollectionDto) {
    const result = await this.catalogService.createCollection(dto);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Get('collections')
  async getCollections() {
    const result = await this.catalogService.getCollections();
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Post('collections/:id/products')
  async addProductsToCollection(@Param('id') id: string, @Body() { productIds }: { productIds: string[] }) {
    const result = await this.catalogService.addProductsToCollection(id, productIds);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Patch('collections/:id')
  async updateCollection(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    const result = await this.catalogService.updateCollection(id, dto);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Delete('collections/:id')
  async deleteCollection(@Param('id') id: string) {
    const result = await this.catalogService.deleteCollection(id);
    return BaseResponseDto.success(result);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Delete('collections/:collectionId/products/:productId')
  async removeProductFromCollection(
    @Param('collectionId') collectionId: string,
    @Param('productId') productId: string,
  ) {
    const result = await this.catalogService.removeProductFromCollection(collectionId, productId);
    return BaseResponseDto.success(result);
  }

  @Get('collections/:slug')
  async getCollectionBySlug(@Param('slug') slug: string, @Query('shopId') shopId: string) {
    const result = await this.catalogService.getCollectionBySlug(slug, shopId);
    return BaseResponseDto.success(result);
  }
  // ----------------------------


  @Get('products')
  async findAll(@Query() query: GetProductsDto) {
    const result = await this.catalogService.findAllProducts(query);
    return BaseResponseDto.success(result);
  }

  @Get('products/shop/:shopId')
  async findShopProducts(@Param('shopId') shopId: string, @Query() query: GetProductsDto) {
    const result = await this.catalogService.findAllProducts({ ...query, shopId });
    return BaseResponseDto.success(result);
  }

  @Get('products/:id')
  async findOne(@Param('id') id: string) {
    const result = await this.catalogService.findOneProduct(id);
    return BaseResponseDto.success(result);
  }

  @Get('products/slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.catalogService.findProductBySlug(slug);
    return BaseResponseDto.success(result);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('products')
  async create(@Body() createProductDto: CreateProductDto) {
    const result = await this.catalogService.createProduct(createProductDto);
    return BaseResponseDto.success(result);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('products/:id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const result = await this.catalogService.updateProduct(id, updateProductDto);
    return BaseResponseDto.success(result);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Delete('products/:id')
  async remove(@Param('id') id: string) {
    const result = await this.catalogService.removeProduct(id);
    return BaseResponseDto.success(result);
  }
}

