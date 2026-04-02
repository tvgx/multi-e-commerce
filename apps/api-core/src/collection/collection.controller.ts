import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, Query } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto, UpdateCollectionDto, AddProductsToCollectionDto } from './dto/collection-zod.dto';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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
  async getCollectionDetail(@Param('slug') slug: string, @Query('shopId') shopId?: string) {
    return this.collectionService.getCollectionDetail(slug, shopId);
  }

  @Post()
  async createCollection(@Session() session: UserSession, @Body() dto: CreateCollectionDto) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.collectionService.createCollection(session.user.id, dto);
  }

  @Put(':id')
  async updateCollection(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.collectionService.updateCollection(session.user.id, id, dto);
  }

  @Post(':id/products')
  async addProductsToCollection(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: AddProductsToCollectionDto,
  ) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.collectionService.addProductsToCollection(session.user.id, id, dto);
  }

  @Delete(':id/products/:productId')
  async removeProductFromCollection(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    if (!session) throw new CustomException(ResponseCodes.TOKEN_INVALID, 'invalid token', HttpStatus.UNAUTHORIZED);
    return this.collectionService.removeProductFromCollection(session.user.id, id, productId);
  }
}
