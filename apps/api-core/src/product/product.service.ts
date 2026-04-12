import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../database/prisma.service';
import {
  ProductLayout,
  ProductDocument,
} from './schemas/product-layout.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product-zod.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    @InjectModel(ProductLayout.name)
    private productLayoutModel: Model<ProductDocument>,
  ) {}

  async createProduct(
    ownerId: string,
    dto: CreateProductDto,
  ): Promise<BaseResponseDto<object>> {
    try {
      const shopId = this.tenantService.getTenantId() || dto.shopId;
      if (!shopId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Tenant identity unknown',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 1. Verify shop ownership
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop)
        throw new CustomException(
          ResponseCodes.NO_DATA_END_OF_LIST,
          'Shop not found',
          HttpStatus.NOT_FOUND,
        );
      if (shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      // 2. Policy check
      if (dto.basePrice > 30000000 || (dto.weight && dto.weight > 20)) {
        throw new CustomException(
          ResponseCodes.POLICY_VIOLATION,
          'Policy Violation, not support weight over 20KG & price over 30M',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Create in Postgres
      const product = await this.prisma.$transaction(async (tx: any) => {
        const p = await tx.product.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            shopId: shopId,
            status: 'PUBLISHED',
          },
        });

        const variant = await tx.variant.create({
          data: {
            productId: p.id,
            sku: dto.sku,
            price: dto.basePrice,
            weight: dto.weight,
            isMaster: true,
          },
        });

        let stockLocation = await tx.stockLocation.findFirst({
          where: { shopId, isDefault: true },
        });

        if (!stockLocation) {
          stockLocation = await tx.stockLocation.create({
            data: {
              shopId,
              name: 'Default Warehouse',
              isDefault: true,
            },
          });
        }

        await tx.stockItem.create({
          data: {
            stockLocationId: stockLocation.id,
            variantId: variant.id,
            countOnHand: dto.inStock || 0,
          },
        });

        return p;
      });

      // 4. Create in MongoDB
      const layout = new this.productLayoutModel({
        productId: product.id,
        shopId: shopId,
        metadata: dto.extraMetadata || {},
        images: dto.images || [],
      });
      await layout.save();

      return BaseResponseDto.success(product);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async getProductsByShop(
    shopId: string,
    limit: number = 20,
    filters?: {
      search?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<BaseResponseDto<object[]>> {
    const currentShopId = this.tenantService.getTenantId();
    const targetShopId = shopId || currentShopId;

    if (!targetShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Tenant identity unknown',
        HttpStatus.BAD_REQUEST,
      );
    }

    const whereClause: any = { shopId: targetShopId };

    if (filters?.search) {
      whereClause.name = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    const priceFilter: any = {};
    if (filters?.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters?.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        variants: {
          where: {
            isMaster: true,
            ...(Object.keys(priceFilter).length > 0
              ? { price: priceFilter }
              : {}),
          },
          include: {
            stockItems: {
              include: { stockLocation: true },
            },
          },
        },
      },
      take: limit,
    });

    if (products.length === 0) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'No Data or end of list data',
        HttpStatus.OK,
      );
    }

    // Merge images from MongoDB
    const productIds = products.map((p: any) => p.id);
    const layouts = await this.productLayoutModel
      .find({ productId: { $in: productIds } })
      .lean();

    const layoutMap = new Map();
    layouts.forEach((item: any) => layoutMap.set(item.productId, item));

    const enrichedProducts = products.map((p: any) => {
      const layout = layoutMap.get(p.id);
      const masterVariant =
        p.variants.find((v: any) => v.isMaster) || p.variants[0];
      return {
        ...p,
        _id: p.id,
        basePrice: masterVariant?.price || 0,
        images: layout?.imageUrls || [],
      };
    });

    return BaseResponseDto.success(enrichedProducts);
  }

  async getProductDetails(productId: string): Promise<BaseResponseDto<object>> {
    const productPostgres = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            stockItems: {
              include: { stockLocation: true },
            },
          },
        },
      },
    });

    if (!productPostgres) {
      throw new CustomException(
        ResponseCodes.PRODUCT_NOT_EXISTED,
        'Product is not existed',
        HttpStatus.NOT_FOUND,
      );
    }

    // Tenant isolation check
    const currentShopId = this.tenantService.getTenantId();
    if (currentShopId && productPostgres.shopId !== currentShopId) {
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );
    }

    const layoutDoc = await this.productLayoutModel
      .findOne({ productId })
      .lean();

    const masterVariant = productPostgres.variants.find((v: any) => v.isMaster);
    const totalStock =
      masterVariant?.stockItems.reduce(
        (acc: any, item: any) => acc + item.countOnHand,
        0,
      ) || 0;

    return BaseResponseDto.success({
      ...productPostgres,
      basePrice: masterVariant?.price || 0,
      inStock: totalStock,
      layout: layoutDoc,
    });
  }

  async updateProduct(
    ownerId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<BaseResponseDto<any>> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product)
      throw new CustomException(
        ResponseCodes.PRODUCT_NOT_EXISTED,
        'Product is not existed',
        HttpStatus.NOT_FOUND,
      );
    if (product.shop.ownerId !== ownerId)
      throw new CustomException(
        ResponseCodes.NOT_ACCESS,
        'Not access.',
        HttpStatus.FORBIDDEN,
      );

    const updatedPostgres = await this.prisma.$transaction(async (tx: any) => {
      // 1. Update Product
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          name: dto.name,
        },
      });

      // 2. Update Master Variant
      const masterVariant = await tx.variant.findFirst({
        where: { productId, isMaster: true },
      });

      if (masterVariant) {
        await tx.variant.update({
          where: { id: masterVariant.id },
          data: {
            sku: dto.sku,
            price: dto.basePrice,
            weight: dto.weight,
          },
        });

        // 3. Update StockItem (in default location)
        if (dto.inStock !== undefined) {
          const defaultLocation = await tx.stockLocation.findFirst({
            where: { shopId: product.shopId, isDefault: true },
          });

          if (defaultLocation) {
            await tx.stockItem.upsert({
              where: {
                stockLocationId_variantId: {
                  stockLocationId: defaultLocation.id,
                  variantId: masterVariant.id,
                },
              },
              create: {
                stockLocationId: defaultLocation.id,
                variantId: masterVariant.id,
                countOnHand: dto.inStock,
              },
              update: {
                countOnHand: dto.inStock,
              },
            });
          }
        }
      }

      return p;
    });

    if (dto.extraMetadata) {
      await this.productLayoutModel.updateOne(
        { productId },
        { $set: { metadata: dto.extraMetadata } },
      );
    }

    return BaseResponseDto.success(updatedPostgres);
  }
}
