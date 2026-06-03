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
          create: dto.variants.map(v => ({
            sku: v.sku,
            price: v.price,
            weight: v.weight,
            currency: v.currency || 'VND',
            isMaster: true,
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

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        status: dto.status,
        // Variant updating logic would be more complex (upsert/delete) in reality
      },
      include: { variants: true }
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

