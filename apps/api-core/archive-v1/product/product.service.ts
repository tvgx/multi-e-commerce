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
  ) { }

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
          include: {
            variants: true,
          },
        });

        // 3.4 Attach OptionTypes
        if (dto.optionTypeIds && dto.optionTypeIds.length > 0) {
          await tx.productOptionType.createMany({
            data: dto.optionTypeIds.map((otId: string) => ({
              productId: p.id,
              optionTypeId: otId,
            })),
            skipDuplicates: true,
          });
        }

        // 3.5 Attach VariantOptionValues
        if (dto.variants && dto.variants.length > 0) {
          for (const vCreated of p.variants) {
            const vData = dto.variants.find((vd: any) => vd.sku === vCreated.sku);
            if (vData && vData.optionValueIds && vData.optionValueIds.length > 0) {
              await tx.variantOptionValue.createMany({
                data: vData.optionValueIds.map((ovId: string) => ({
                  variantId: vCreated.id,
                  optionValueId: ovId,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        // 3.6 Attach collections
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

      // 4. Resolve and build enriched variants data for MongoDB ProductLayout
      const allOptionValueIds: string[] = [];
      if (dto.variants) {
        dto.variants.forEach((v: any) => {
          if (v.optionValueIds) {
            allOptionValueIds.push(...v.optionValueIds);
          }
        });
      }

      const optionValues = allOptionValueIds.length > 0
        ? await this.prisma.optionValue.findMany({
            where: { id: { in: allOptionValueIds } },
            include: { optionType: true },
          })
        : [];

      const valueMap = new Map<string, any>(
        optionValues.map((ov: any) => [ov.id, ov]),
      );

      const variantsDataForMongo = dto.variants
        ? dto.variants.map((v: any) => {
            const attributes = { ...(v.attributes || {}) };
            if (v.optionValueIds) {
              v.optionValueIds.forEach((ovId: string) => {
                const ov = valueMap.get(ovId);
                if (ov) {
                  attributes[ov.optionType.name] = ov.presentation;
                }
              });
            }
            return {
              sku: v.sku,
              attributes,
              image: v.image || '',
            };
          })
        : [];

      const layout = new this.productLayoutModel({
        productId: product.id,
        shopId: shopId,
        attributes: dto.attributes || {},
        imageUrls: dto.images || [],
        variantsData: variantsDataForMongo,
        descriptionHtml: dto.descriptionHtml || '',
        videoUrls: dto.videoUrls || [],
        seoData: dto.seoData || {
          metaTitle: '',
          metaDescription: '',
          keywords: [],
        },
        customLandingPageLayout: dto.customLandingPageLayout || null,
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
      isStorefront?: boolean;
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

    const isStorefront = filters?.isStorefront !== false;
    const whereClause: any = {
      shopId: targetShopId,
      ...(isStorefront
        ? { status: 'PUBLISHED' }
        : { NOT: { status: 'ARCHIVED' } }),
    };

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
        optionTypes: {
          include: {
            optionType: {
              include: { optionValues: true },
            },
          },
        },
        variants: {
          include: {
            stockItems: {
              include: { stockLocation: true },
            },
            optionValues: {
              include: {
                optionValue: true,
              },
            },
          },
        },
      },
    });

    if (!productPostgres || productPostgres.status === 'ARCHIVED') {
      throw new CustomException(
        ResponseCodes.PRODUCT_NOT_EXISTED,
        'Product is not existed',
        HttpStatus.NOT_FOUND,
      );
    }

    // Tenant isolation check
    const currentShopId = this.tenantService.getTenantId();
    if (currentShopId) {
      if (productPostgres.shopId !== currentShopId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }
      if (productPostgres.status !== 'PUBLISHED') {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Product is not published',
          HttpStatus.NOT_FOUND,
        );
      }
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

    const mongoUpdate: any = {};
    if (dto.attributes !== undefined) mongoUpdate.attributes = dto.attributes;
    if (dto.descriptionHtml !== undefined)
      mongoUpdate.descriptionHtml = dto.descriptionHtml;
    if (dto.videoUrls !== undefined) mongoUpdate.videoUrls = dto.videoUrls;
    if (dto.seoData !== undefined) mongoUpdate.seoData = dto.seoData;
    if (dto.customLandingPageLayout !== undefined)
      mongoUpdate.customLandingPageLayout = dto.customLandingPageLayout;
 
    if (Object.keys(mongoUpdate).length > 0) {
      await this.productLayoutModel.updateOne(
        { productId },
        { $set: mongoUpdate },
      );
    }

    // Invalidate caches
    await this.cacheService.del(`product:${productId}`);
    // We don't have a good way to delete pattern keys easily with standard cache-manager,
    // but we can at least invalidate the details.
    // For listing, it will expire in 5 mins anyway.

    return BaseResponseDto.success(updatedPostgres);
  }

  async deleteProduct(
    ownerId: string,
    productId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { shop: true },
      });

      if (!product) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Product is not existed',
          HttpStatus.NOT_FOUND,
        );
      }

      if (product.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      // 1. Soft Delete in PostgreSQL
      await this.prisma.product.update({
        where: { id: productId },
        data: { status: 'ARCHIVED' },
      });

      // 2. Delete from MongoDB ProductLayout
      await this.productLayoutModel.deleteOne({ productId });

      // 3. Invalidate caches
      await this.cacheService.del(`product:${productId}`);
      await this.cacheService.del(`products:${product.shopId}:*`);

      return BaseResponseDto.success({ deleted: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  async updateProductStatus(
    ownerId: string,
    productId: string,
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  ): Promise<BaseResponseDto<any>> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { shop: true, variants: true },
      });

      if (!product) {
        throw new CustomException(
          ResponseCodes.PRODUCT_NOT_EXISTED,
          'Product is not existed',
          HttpStatus.NOT_FOUND,
        );
      }

      if (product.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      // 1. Update in PostgreSQL
      await this.prisma.product.update({
        where: { id: productId },
        data: { status },
      });

      // 2. Update MongoDB Layout based on status
      if (status === 'ARCHIVED') {
        await this.productLayoutModel.deleteOne({ productId });
      } else {
        const existingLayout = await this.productLayoutModel.findOne({
          productId,
        });
        if (!existingLayout) {
          const masterVariant =
            product.variants.find((v: any) => v.isMaster) ||
            product.variants[0];
          await this.productLayoutModel.create({
            productId,
            shopId: product.shopId,
            attributes: {},
            imageUrls: [],
            variantsData: masterVariant
              ? [{ sku: masterVariant.sku, attributes: {}, image: '' }]
              : [],
            descriptionHtml: '',
            videoUrls: [],
            seoData: { metaTitle: '', metaDescription: '', keywords: [] },
            customLandingPageLayout: null,
          });
        }
      }

      // 3. Invalidate caches
      await this.cacheService.del(`product:${productId}`);
      await this.cacheService.del(`products:${product.shopId}:*`);

      return BaseResponseDto.success({ status });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to update product status');
    }
  }
}
