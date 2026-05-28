import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddProductsToCollectionDto,
} from './dto/collection-zod.dto';
import { BetterAuthGuard } from '../modules/auth/guards/better-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('collections')
@UseGuards(BetterAuthGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Public()
  @Get()
  async getCollections(@Query('shopId') shopId?: string) {
    return this.collectionService.getCollectionsByShop(shopId);
  }

  @Public()
  @Get(':slug')
  async getCollectionDetail(
    @Param('slug') slug: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.collectionService.getCollectionDetail(slug, shopId);
  }

  @Public()
  @Get('storefront/:slug/products')
  async getStorefrontCollectionProducts(
    @Param('slug') slug: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.collectionService.getStorefrontCollectionProducts(slug, shopId);
  }

  @Post()
  async createCollection(
    @CurrentUser() user: any,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionService.createCollection(user.id, dto);
  }

  @Put(':id')
  async updateCollection(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionService.updateCollection(user.id, id, dto);
  }

  @Post(':id/products')
  async addProductsToCollection(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddProductsToCollectionDto,
  ) {
    return this.collectionService.addProductsToCollection(user.id, id, dto);
  }

  @Delete(':id/products/:productId')
  async removeProductFromCollection(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.collectionService.removeProductFromCollection(
      user.id,
      id,
      productId,
    );
  }

  @Delete(':id')
  async deleteCollection(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.collectionService.deleteCollection(user.id, id);
  }
}
