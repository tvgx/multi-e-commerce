import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../common/services/tenant.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import {
  CreateStockLocationDto,
  UpdateStockLocationDto,
  AdjustStockItemDto,
} from './dto/inventory-zod.dto';
import { SystemCacheService } from '../system/cache/cache.service';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TenantService) private readonly tenantService: TenantService,
    @Inject(SystemCacheService) private readonly cacheService: SystemCacheService,
  ) {}

  private async checkShopOwnership(ownerId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new CustomException(
        ResponseCodes.URL_USER_IS_EXIST,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );
    }
    return shop;
  }

  async createStockLocation(
    ownerId: string,
    dto: CreateStockLocationDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const shopId = this.tenantService.getTenantId() || dto.shopId;
      if (!shopId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Tenant identity unknown',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.checkShopOwnership(ownerId, shopId);

      const location = await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) {
          // Set all other locations isDefault to false
          await tx.stockLocation.updateMany({
            where: { shopId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.stockLocation.create({
          data: {
            shopId,
            name: dto.name,
            adminName: dto.adminName,
            active: dto.active ?? true,
            isDefault: dto.isDefault ?? false,
          },
        });
      });

      return BaseResponseDto.success(location);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create stock location');
    }
  }

  async getAllStockLocations(shopId?: string): Promise<BaseResponseDto<any[]>> {
    const targetShopId = shopId || this.tenantService.getTenantId();
    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const locations = await this.prisma.stockLocation.findMany({
      where: { shopId: targetShopId },
      orderBy: { createdAt: 'desc' },
    });

    return BaseResponseDto.success(locations);
  }

  async getStockLocationDetail(
    ownerId: string,
    id: string,
  ): Promise<BaseResponseDto<any>> {
    const location = await this.prisma.stockLocation.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!location) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Stock location not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (location.shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Omit shop details for clean response
    const { shop, ...cleanLocation } = location as any;
    return BaseResponseDto.success(cleanLocation);
  }

  async updateStockLocation(
    ownerId: string,
    id: string,
    dto: UpdateStockLocationDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const location = await this.prisma.stockLocation.findUnique({
        where: { id },
        include: { shop: true },
      });

      if (!location) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Stock location not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (location.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) {
          // Unset any default for this shop
          await tx.stockLocation.updateMany({
            where: { shopId: location.shopId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.stockLocation.update({
          where: { id },
          data: {
            name: dto.name,
            adminName: dto.adminName,
            active: dto.active,
            isDefault: dto.isDefault,
          },
        });
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update stock location');
    }
  }

  async deleteStockLocation(
    ownerId: string,
    id: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const location = await this.prisma.stockLocation.findUnique({
        where: { id },
        include: { shop: true },
      });

      if (!location) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Stock location not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (location.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (location.isDefault) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Cannot delete the default stock location of the shop.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.stockLocation.delete({
        where: { id },
      });

      return BaseResponseDto.success({ deleted: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to delete stock location');
    }
  }

  async adjustStockItem(
    ownerId: string,
    locationId: string,
    dto: AdjustStockItemDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const location = await this.prisma.stockLocation.findUnique({
        where: { id: locationId },
        include: { shop: true },
      });

      if (!location) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Stock location not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (location.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      const variant = await this.prisma.variant.findUnique({
        where: { id: dto.variantId },
        select: { productId: true, product: { select: { shopId: true } } },
      });

      if (!variant) {
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Product variant not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (variant.product.shopId !== location.shopId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Variant does not belong to the location shop.',
          HttpStatus.FORBIDDEN,
        );
      }

      const stockItem = await this.prisma.stockItem.upsert({
        where: {
          stockLocationId_variantId: {
            stockLocationId: locationId,
            variantId: dto.variantId,
          },
        },
        create: {
          stockLocationId: locationId,
          variantId: dto.variantId,
          countOnHand: dto.countOnHand,
          backorderable: dto.backorderable ?? false,
        },
        update: {
          countOnHand: dto.countOnHand,
          backorderable: dto.backorderable !== undefined ? dto.backorderable : undefined,
        },
      });

      // Clear product and listing cache
      await this.cacheService.del(`product:${variant.productId}`);
      await this.cacheService.del(`products:${location.shopId}:*`);

      return BaseResponseDto.success(stockItem);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to adjust stock item');
    }
  }

  async getStockItemsByLocation(
    ownerId: string,
    locationId: string,
  ): Promise<BaseResponseDto<any[]>> {
    const location = await this.prisma.stockLocation.findUnique({
      where: { id: locationId },
      include: { shop: true },
    });

    if (!location) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Stock location not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (location.shop.ownerId !== ownerId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );
    }

    const items = await this.prisma.stockItem.findMany({
      where: { stockLocationId: locationId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    return BaseResponseDto.success(items);
  }
}
