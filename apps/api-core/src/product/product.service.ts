import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  Inject,
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
import { SystemCacheService } from '../system/cache/cache.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(TenantService) private tenantService: TenantService,
    @InjectModel(ProductLayout.name)
    private productLayoutModel: Model<ProductDocument>,
    @Inject(SystemCacheService)
    private readonly cacheService: SystemCacheService,
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

        const variantsToCreate =
          dto.variants && dto.variants.length > 0
            ? dto.variants
            : [
                {
                  sku: dto.sku || `SKU-${Date.now()}`,
                  price: dto.basePrice || 0,
                  weight: dto.weight,
                  inStock: dto.inStock || 0,
                  isMaster: true,
                },
              ];

        const p = await tx.product.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            shopId: shopId,
            status: 'PUBLISHED',
            variants: {
              create: variantsToCreate.map((vData: any, i: number) => ({
                shopId: shopId,
                sku: vData.sku,
                price: vData.price,
                weight: vData.weight,
                isMaster: i === 0, // First variant is master
                stockItems: {
                  create: {
                    stockLocationId: stockLocation.id,
                    countOnHand: vData.inStock || 0,
                  },
                },
              })),
            },
          },
        });

        // 3.5 Attach collections
        if (dto.collectionIds && dto.collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: dto.collectionIds.map((colId: string) => ({
              productId: p.id,
              collectionId: colId,
            })),
            skipDuplicates: true,
          });
        }

        return p;
      });

      // 4. Create in MongoDB
      const variantsDataForMongo = dto.variants
        ? dto.variants.map((v: any) => ({
            sku: v.sku,
            attributes: v.attributes || {},
            image: v.image || '',
          }))
        : [];

      const layout = new this.productLayoutModel({
        productId: product.id,
        shopId: shopId,
        attributes: dto.attributes || {},
        imageUrls: dto.images || [],
        variantsData: variantsDataForMongo,
      });
      await layout.save();

      await this.cacheService.del(`products:${shopId}:*`); // Pattern matching would be nice, but simple delete for now or use a more specific strategy
      // For now, let's just accept that we might need to purge all shop products on create/update
      // A better way is to use a cache version or tags if Redis supports them

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

    const cacheKey = `products:${targetShopId}:${limit}:${JSON.stringify(filters || {})}`;
    const cached = await this.cacheService.get<object[]>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

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
        collections: {
          include: { collection: true },
        },
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

    await this.cacheService.set(cacheKey, enrichedProducts, 300000); // 5 minutes cache
    return BaseResponseDto.success(enrichedProducts);
  }

  async getProductDetails(productId: string): Promise<BaseResponseDto<object>> {
    const cacheKey = `product:${productId}`;
    const cached = await this.cacheService.get<object>(cacheKey);
    if (cached) return BaseResponseDto.success(cached);

    const productPostgres = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        collections: {
          include: { collection: true },
        },
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

    const result = {
      ...productPostgres,
      basePrice: masterVariant?.price || 0,
      inStock: totalStock,
      layout: layoutDoc,
    };

    await this.cacheService.set(cacheKey, result, 600000); // 10 minutes cache
    return BaseResponseDto.success(result);
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

      // 4. Sync Collections
      if (dto.collectionIds !== undefined) {
        // Delete old assignments
        await tx.productCollection.deleteMany({
          where: { productId },
        });

        // Insert new ones
        if (dto.collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: dto.collectionIds.map((colId: string) => ({
              productId,
              collectionId: colId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return p;
    });

    if (dto.attributes) {
      await this.productLayoutModel.updateOne(
        { productId },
        { $set: { attributes: dto.attributes } },
      );
    }

    // Invalidate caches
    await this.cacheService.del(`product:${productId}`);
    // We don't have a good way to delete pattern keys easily with standard cache-manager,
    // but we can at least invalidate the details.
    // For listing, it will expire in 5 mins anyway.

    return BaseResponseDto.success(updatedPostgres);
  }
}
