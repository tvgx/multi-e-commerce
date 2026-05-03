import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddProductsToCollectionDto,
} from './dto/collection-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  async getCollections(@Query('shopId') shopId?: string) {
    return this.collectionService.getCollectionsByShop(shopId);
  }

  @Get(':slug')
  async getCollectionDetail(
    @Param('slug') slug: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.collectionService.getCollectionDetail(slug, shopId);
  }

  @Post()
  async createCollection(@Body() dto: CreateCollectionDto) {
    const userId = 'dev-user-123';
    return this.collectionService.createCollection(userId, dto);
  }

  @Put(':id')
  async updateCollection(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    const userId = 'dev-user-123';
    return this.collectionService.updateCollection(userId, id, dto);
  }

  @Post(':id/products')
  async addProductsToCollection(
    @Param('id') id: string,
    @Body() dto: AddProductsToCollectionDto,
  ) {
    const userId = 'dev-user-123';
    return this.collectionService.addProductsToCollection(userId, id, dto);
  }

  @Delete(':id/products/:productId')
  async removeProductFromCollection(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    const userId = 'dev-user-123';
    return this.collectionService.removeProductFromCollection(
      userId,
      id,
      productId,
    );
  }
}
