import { Injectable, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { CreateCollectionDto, UpdateCollectionDto, AddProductsToCollectionDto } from './dto/collection-zod.dto';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async createCollection(ownerId: string, dto: CreateCollectionDto): Promise<BaseResponseDto<any>> {
    try {
      const shopId = this.tenantService.getTenantId();
      if (!shopId) {
        throw new CustomException(ResponseCodes.NOT_ACCESS, 'Tenant identity unknown', HttpStatus.BAD_REQUEST);
      }

      // Verify ownership
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop || shop.ownerId !== ownerId) {
        throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);
      }

      // Check slug uniqueness within shop
      const existing = await (this.prisma as any).collection.findUnique({
        where: { shopId_slug: { shopId, slug: dto.slug } },
      });
      if (existing) {
        throw new CustomException(ResponseCodes.URL_USER_IS_EXIST, 'Slug already exists for this shop', HttpStatus.CONFLICT);
      }

      const collection = await (this.prisma as any).collection.create({
        data: {
          ...dto,
          shopId,
        },
      });

      return BaseResponseDto.success(collection);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create collection');
    }
  }

  async getCollectionsByShop(shopId?: string): Promise<BaseResponseDto<any[]>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(ResponseCodes.NOT_ACCESS, 'Tenant identity unknown', HttpStatus.BAD_REQUEST);
    }

    const collections = await (this.prisma as any).collection.findMany({
      where: { shopId: targetShopId, isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return BaseResponseDto.success(collections);
  }

  async getCollectionDetail(slug: string, shopId?: string): Promise<BaseResponseDto<any>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(ResponseCodes.NOT_ACCESS, 'Tenant identity unknown', HttpStatus.BAD_REQUEST);
    }

    const collection = await (this.prisma as any).collection.findUnique({
      where: { shopId_slug: { shopId: targetShopId, slug } },
      include: {
        products: {
          include: {
            product: {
              include: {
                variants: { where: { isMaster: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Collection not found', HttpStatus.NOT_FOUND);
    }

    return BaseResponseDto.success(collection);
  }

  async updateCollection(ownerId: string, id: string, dto: UpdateCollectionDto): Promise<BaseResponseDto<any>> {
    try {
      const shopId = this.tenantService.getTenantId();
      const collection = await this.prisma.collection.findUnique({
        where: { id },
        include: { shop: true },
      });

      if (!collection) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Collection not found', HttpStatus.NOT_FOUND);
      if (collection.shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

      const updated = await (this.prisma as any).collection.update({
        where: { id },
        data: dto,
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update collection');
    }
  }

  async addProductsToCollection(ownerId: string, collectionId: string, dto: AddProductsToCollectionDto): Promise<BaseResponseDto<any>> {
    try {
      const collection = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        include: { shop: true },
      });

      if (!collection) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Collection not found', HttpStatus.NOT_FOUND);
      if (collection.shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

      // Add products using transaction
      await this.prisma.$transaction(
        dto.productIds.map((productId: string, index: number) =>
          (this.prisma as any).productCollection.upsert({
            where: {
              productId_collectionId: { productId, collectionId },
            },
            create: { productId, collectionId, order: index },
            update: { order: index },
          }),
        ),
      );

      return BaseResponseDto.success({ success: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to add products to collection');
    }
  }

  async removeProductFromCollection(ownerId: string, collectionId: string, productId: string): Promise<BaseResponseDto<any>> {
    try {
      const collection = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        include: { shop: true },
      });

      if (!collection) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Collection not found', HttpStatus.NOT_FOUND);
      if (collection.shop.ownerId !== ownerId) throw new CustomException(ResponseCodes.NOT_ACCESS, 'Not access.', HttpStatus.FORBIDDEN);

      await (this.prisma as any).productCollection.delete({
        where: {
          productId_collectionId: { productId, collectionId },
        },
      });

      return BaseResponseDto.success({ success: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to remove product from collection');
    }
  }
}
