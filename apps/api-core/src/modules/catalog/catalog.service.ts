import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@Injectable()
export class CatalogService {
  // Columns the client may sort products by. Anything else would reach Prisma's
  // orderBy verbatim and throw a PrismaClientValidationError 500 at runtime —
  // and since the app has no global ValidationPipe, the DTO's @IsString on
  // `sortBy` never runs, so the value is fully attacker-controlled. Mirrors the
  // ORD-4 allowlist in OrderService. Default + fallback: createdAt.
  private static readonly SORTABLE_PRODUCT_COLUMNS = [
    'createdAt',
    'updatedAt',
    'name',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) {
      throw new BadRequestException('Shop context is missing');
    }
    return shopId;
  }

  /**
   * REV-2: published-review rating rollup, computed at read time. Product has no
   * denormalised avgRating/reviewCount column, so we aggregate ProductReview on
   * each read and attach `ratingAvg`/`ratingCount` to the returned products —
   * keeping reviews and the displayed rating in sync without a migration.
   * Returns a map productId → stats. Tolerates an unmocked groupBy (→ no ratings).
   */
  private async getRatingStats(
    shopId: string,
    productIds: string[],
  ): Promise<Map<string, { ratingAvg: number; ratingCount: number }>> {
    const map = new Map<string, { ratingAvg: number; ratingCount: number }>();
    if (productIds.length === 0) return map;
    const grouped =
      (await this.prisma.productReview.groupBy({
        by: ['productId'],
        where: { shopId, productId: { in: productIds }, status: 'published' },
        _avg: { rating: true },
        _count: { _all: true },
      })) ?? [];
    for (const g of grouped) {
      map.set(g.productId, {
        // One decimal place is plenty for a star rating.
        ratingAvg: g._avg?.rating ? Math.round(g._avg.rating * 10) / 10 : 0,
        ratingCount: g._count?._all ?? 0,
      });
    }
    return map;
  }

  private withRating(
    product: any,
    stats: Map<string, { ratingAvg: number; ratingCount: number }>,
  ) {
    const s = stats.get(product.id) ?? { ratingAvg: 0, ratingCount: 0 };
    return { ...product, ratingAvg: s.ratingAvg, ratingCount: s.ratingCount };
  }

  // --- Collection Methods ---
  async createCollection(dto: CreateCollectionDto) {
    const shopId = this.getShopId();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create collection
      const collection = await tx.collection.create({
        data: {
          shopId,
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          imageUrl: dto.imageUrl,
        },
      });

      // 2. Link products if provided
      if (dto.productIds && dto.productIds.length > 0) {
        // Verify all products belong to the shop
        const products = await tx.product.findMany({
          where: { id: { in: dto.productIds }, shopId },
        });

        if (products.length !== dto.productIds.length) {
          throw new BadRequestException('One or more products not found or belong to another shop');
        }

        const operations = dto.productIds.map(productId => 
          tx.productCollection.create({
            data: {
              productId,
              collectionId: collection.id,
            }
          })
        );
        await Promise.all(operations);
      }

      return collection;
    });
  }

  async getCollections() {
    const shopId = this.getShopId();
    return this.prisma.collection.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      // Admin "Categories" list hiển thị số sản phẩm qua _count.products
      include: { _count: { select: { products: true } } },
    });
  }

  async addProductsToCollection(collectionId: string, productIds: string[]) {
    const shopId = this.getShopId();
    // Verify ownership
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, shopId },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    // Verify all products belong to the shop
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Add them all
    const operations = productIds.map(productId => 
      this.prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId,
            collectionId,
          },
        },
        create: { productId, collectionId },
        update: {},
      })
    );

    return this.prisma.$transaction(operations);
  }

  async updateCollection(id: string, dto: UpdateCollectionDto) {
    const shopId = this.getShopId();
    const existing = await this.prisma.collection.findFirst({
      where: { id, shopId },
    });
    if (!existing) throw new NotFoundException('Collection not found');
    return this.prisma.collection.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
      },
    });
  }

  // ProductCollection xoá theo qua FK cascade
  async deleteCollection(id: string) {
    const shopId = this.getShopId();
    const existing = await this.prisma.collection.findFirst({
      where: { id, shopId },
    });
    if (!existing) throw new NotFoundException('Collection not found');
    return this.prisma.collection.delete({ where: { id } });
  }

  async getCollectionBySlug(slug: string, shopId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, shopId },
      include: {
        products: { include: { product: { include: { variants: true } } } },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async removeProductFromCollection(collectionId: string, productId: string) {
    const shopId = this.getShopId();
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, shopId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return this.prisma.productCollection.delete({
      where: {
        productId_collectionId: { productId, collectionId },
      },
    });
  }
  // -------------------------

  async findAllProducts(query: GetProductsDto) {
    const shopId = query.shopId || this.getShopId();
    const {
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      categoryId,
      inStockOnly,
      status,
    } = query;
    // Query string không qua transform pipe nên phải tự ép kiểu số
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const minPrice =
      query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice =
      query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
    const skip = (page - 1) * limit;

    // Sanitize sort inputs: no global ValidationPipe runs, so sortBy/sortOrder
    // arrive raw from the public query string (see SORTABLE_PRODUCT_COLUMNS).
    const sortColumn = CatalogService.SORTABLE_PRODUCT_COLUMNS.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = { shopId };

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          variants: {
            some: { sku: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Lọc theo giá / tồn kho trên cùng một điều kiện variants.some
    const variantFilter: any = {};
    if (minPrice !== undefined || maxPrice !== undefined) {
      variantFilter.price = {};
      if (minPrice !== undefined) variantFilter.price.gte = minPrice;
      if (maxPrice !== undefined) variantFilter.price.lte = maxPrice;
    }
    if (inStockOnly) {
      variantFilter.stockItems = { some: { countOnHand: { gt: 0 } } };
    }
    if (Object.keys(variantFilter).length > 0) {
      where.variants = { some: variantFilter };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortColumn]: sortDirection },
        // stockItems: bảng Products trên admin tính tồn kho từ đây — thiếu là
        // cột Inventory hiện 0 dù kho có hàng.
        include: { variants: { include: { stockItems: true } }, category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    const ratings = await this.getRatingStats(
      shopId,
      items.map((p) => p.id),
    );

    return {
      data: items.map((p) => this.withRating(p, ratings)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneProduct(id: string) {
    const shopId = this.getShopId();
    const product = await this.prisma.product.findFirst({
      where: { id, shopId },
      include: { variants: { include: { stockItems: true } }, category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const ratings = await this.getRatingStats(shopId, [product.id]);
    return this.withRating(product, ratings);
  }

  async findProductBySlug(slug: string) {
    const shopId = this.getShopId();
    const product = await this.prisma.product.findUnique({
      where: { shopId_slug: { shopId, slug } },
      include: { variants: true, category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const ratings = await this.getRatingStats(shopId, [product.id]);
    return this.withRating(product, ratings);
  }

  // CAT-3: reconcile a product's collection links to exactly `collectionIds`.
  // Verifies every collection belongs to the shop, removes stale links and
  // upserts the requested ones. An empty array clears all links.
  private async syncCollections(
    tx: any,
    shopId: string,
    productId: string,
    collectionIds: string[],
  ) {
    const ids = [...new Set(collectionIds)];
    if (ids.length === 0) {
      await tx.productCollection.deleteMany({ where: { productId } });
      return;
    }
    const cols = await tx.collection.findMany({
      where: { id: { in: ids }, shopId },
      select: { id: true },
    });
    if (cols.length !== ids.length) {
      throw new BadRequestException(
        'One or more collections not found or belong to another shop',
      );
    }
    await tx.productCollection.deleteMany({
      where: { productId, collectionId: { notIn: ids } },
    });
    for (const collectionId of ids) {
      await tx.productCollection.upsert({
        where: { productId_collectionId: { productId, collectionId } },
        create: { productId, collectionId },
        update: {},
      });
    }
  }

  // Ghi StockItem ban đầu ở kho mặc định cho các variant chưa có dòng tồn kho.
  // Shop mới có thể chưa có kho (warehouse chỉ được tạo ở bước Billing &
  // Shipping của wizard) — tạo trước một kho mặc định rỗng; upsertWarehouse về
  // sau update đúng kho này. KHÔNG đụng tồn kho hiện có — số lượng thực quản
  // lý qua trang Inventory (adjust/restock).
  private async seedDefaultStock(
    tx: any,
    shopId: string,
    variants: { id: string; sku: string }[],
    dtoVariants: { sku: string; inStock?: number }[],
  ) {
    if (!variants.length) return;
    let location = await tx.stockLocation.findFirst({
      where: { shopId, isDefault: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!location) {
      location = await tx.stockLocation.create({
        data: { shopId, name: 'Kho mặc định', isDefault: true, active: true },
      });
    }
    // Không có global ValidationPipe nên inStock phải tự ép kiểu ở đây.
    const stockBySku = new Map(dtoVariants.map((v) => [v.sku, Number(v.inStock)]));
    await tx.stockItem.createMany({
      data: variants.map((v) => {
        const n = stockBySku.get(v.sku);
        return {
          stockLocationId: location.id,
          variantId: v.id,
          countOnHand: Number.isFinite(n) ? Math.max(0, Math.floor(n as number)) : 0,
        };
      }),
    });
  }

  async createProduct(dto: CreateProductDto) {
    const shopId = this.getShopId();

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          shopId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          categoryId: dto.categoryId,
          imageUrl: dto.imageUrl ?? dto.images?.[0],
          images: dto.images || [],
          status: dto.status || 'DRAFT',
          variants: dto.variants
            ? {
                create: dto.variants.map((v, index) => ({
                  shopId,
                  sku: v.sku,
                  price: v.price,
                  weight: v.weight,
                  currency: v.currency || 'VND',
                  isMaster: index === 0, // First variant is master
                })),
              }
            : undefined,
        },
        include: { variants: true },
      });

      if (dto.collectionIds) {
        await this.syncCollections(tx, shopId, product.id, dto.collectionIds);
      }

      if (dto.variants?.length) {
        await this.seedDefaultStock(tx, shopId, product.variants, dto.variants);
      }

      return product;
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const shopId = this.getShopId();
    // Verify ownership
    await this.findOneProduct(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update basic product info
      const product = await tx.product.update({
        where: { id: id, shopId },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          categoryId: dto.categoryId,
          imageUrl: dto.imageUrl ?? dto.images?.[0],
          images: dto.images,
          status: dto.status,
        },
      });

      // 2. Upsert/Delete variants if provided
      if (dto.variants && dto.variants.length > 0) {
        const incomingSkus = dto.variants.map((v) => v.sku);

        // Delete variants not in incoming list
        await tx.variant.deleteMany({
          where: {
            productId: id,
            shopId,
            sku: { notIn: incomingSkus },
          },
        });

        // Upsert each variant
        for (const [index, v] of dto.variants.entries()) {
          await tx.variant.upsert({
            where: { shopId_sku: { shopId, sku: v.sku } },
            create: {
              shopId,
              productId: id,
              sku: v.sku,
              price: v.price,
              weight: v.weight,
              currency: v.currency || 'VND',
              isMaster: index === 0,
            },
            update: {
              price: v.price,
              weight: v.weight,
              currency: v.currency,
              isMaster: index === 0,
            },
          });
        }

        // Variant thiếu StockItem (mới thêm, hoặc tạo trước khi shop có kho) →
        // seed ở kho mặc định với inStock từ form.
        const orphanVariants = await tx.variant.findMany({
          where: { productId: id, shopId, stockItems: { none: {} } },
          select: { id: true, sku: true },
        });
        await this.seedDefaultStock(tx, shopId, orphanVariants, dto.variants);

        // Form sản phẩm gửi inStock cho variant đã có tồn kho → ghi đè
        // countOnHand ở kho mặc định (shop chỉ có 1 kho; điều chỉnh nhiều kho
        // vẫn qua trang Inventory). Bỏ qua variant không gửi inStock.
        const defaultLocation = await tx.stockLocation.findFirst({
          where: { shopId, isDefault: true },
          orderBy: { createdAt: 'asc' },
        });
        if (defaultLocation) {
          for (const v of dto.variants) {
            const n = Number(v.inStock);
            if (!Number.isFinite(n)) continue;
            const variant = await tx.variant.findUnique({
              where: { shopId_sku: { shopId, sku: v.sku } },
              select: { id: true },
            });
            if (!variant) continue;
            await tx.stockItem.updateMany({
              where: { variantId: variant.id, stockLocationId: defaultLocation.id },
              data: { countOnHand: Math.max(0, Math.floor(n)) },
            });
          }
        }
      }

      // CAT-3: sync collection membership when the form sends it (it always
      // does, even as an empty list to clear). `undefined` leaves links alone.
      if (dto.collectionIds) {
        await this.syncCollections(tx, shopId, id, dto.collectionIds);
      }

      return tx.product.findUnique({
        where: { id: id },
        include: { variants: true },
      });
    });
  }

  async removeProduct(id: string) {
    const shopId = this.getShopId();
    await this.findOneProduct(id);
    // Soft delete usually preferred
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
