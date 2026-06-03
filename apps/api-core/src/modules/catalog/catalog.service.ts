import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';

@Injectable()
export class CatalogService {
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

  async findAllProducts(query: GetProductsDto) {
    const shopId = this.getShopId();
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', search, categoryId, inStockOnly, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    // Simplistic stock check on variants for example purposes
    if (inStockOnly) {
      where.variants = { some: { stockItems: { some: { countOnHand: { gt: 0 } } } } };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: { variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOneProduct(id: string) {
    const shopId = this.getShopId();
    const product = await this.prisma.product.findFirst({
      where: { id, shopId },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findProductBySlug(slug: string) {
    const shopId = this.getShopId();
    const product = await this.prisma.product.findUnique({
      where: { shopId_slug: { shopId, slug } },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    const shopId = this.getShopId();
    
    // Prisma transaction or nested create
    return this.prisma.product.create({
      data: {
        shopId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status || 'DRAFT',
        variants: dto.variants ? {
          create: dto.variants.map((v, index) => ({
            shopId,
            sku: v.sku,
            price: v.price,
            weight: v.weight,
            currency: v.currency || 'VND',
            isMaster: index === 0, // First variant is master
          }))
        } : undefined,
      },
      include: { variants: true }
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
          status: dto.status,
        },
      });

      // 2. Upsert/Delete variants if provided
      if (dto.variants && dto.variants.length > 0) {
         const incomingSkus = dto.variants.map(v => v.sku);

         // Delete variants not in incoming list
         await tx.variant.deleteMany({
           where: {
             productId: id,
             shopId,
             sku: { notIn: incomingSkus }
           }
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
                 isMaster: index === 0
               },
               update: {
                 price: v.price,
                 weight: v.weight,
                 currency: v.currency,
                 isMaster: index === 0
               }
            });
         }
      }

      return tx.product.findUnique({
         where: { id: id },
         include: { variants: true }
      });
    });
  }

  async removeProduct(id: string) {
    const shopId = this.getShopId();
    await this.findOneProduct(id);
    // Soft delete usually preferred
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }
}

