import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, StreamableFile, Header } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateCollectionDto } from './dto/collection.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@UseGuards(BetterAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly catalogStreamService: CatalogStreamService
  ) {}

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
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.catalogService.createCollection(dto);
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Get('collections')
  getCollections() {
    return this.catalogService.getCollections();
  }

  @RequireRoles('ADMIN', 'OWNER')
  @Post('collections/:id/products')
  addProductToCollection(@Param('id') id: string, @Body() { productId }: { productId: string }) {
    return this.catalogService.addProductToCollection(id, productId);
  }
  // ----------------------------


  @Get('products')
  findAll(@Query() query: GetProductsDto) {
    return this.catalogService.findAllProducts(query);
  }

  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOneProduct(id);
  }

  @Get('products/slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.catalogService.findProductBySlug(slug);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('products')
  create(@Body() createProductDto: CreateProductDto) {
    return this.catalogService.createProduct(createProductDto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('products/:id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, updateProductDto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Delete('products/:id')
  remove(@Param('id') id: string) {
    return this.catalogService.removeProduct(id);
  }
}

