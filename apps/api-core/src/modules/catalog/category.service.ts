import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
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

  async findAll() {
    const shopId = this.getShopId();
    return this.prisma.category.findMany({
      where: { shopId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  async findOne(id: string) {
    const shopId = this.getShopId();
    const category = await this.prisma.category.findFirst({
      where: { id, shopId },
      include: {
        children: { orderBy: { position: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const shopId = this.getShopId();
    const category = await this.prisma.category.findUnique({
      where: { shopId_slug: { shopId, slug } },
      include: {
        children: { orderBy: { position: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const shopId = this.getShopId();
    if (dto.parentId) {
      await this.verifyParent(shopId, dto.parentId);
    }
    return this.prisma.category.create({
      data: {
        shopId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const shopId = this.getShopId();
    await this.findOne(id); // verify ownership
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.verifyParent(shopId, dto.parentId);
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        position: dto.position,
        isActive: dto.isActive,
      },
    });
  }

  // FK đã lo phần dọn dẹp: products.categoryId -> SET NULL, children.parentId -> SET NULL
  async remove(id: string) {
    const shopId = this.getShopId();
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }

  private async verifyParent(shopId: string, parentId: string) {
    const parent = await this.prisma.category.findFirst({
      where: { id: parentId, shopId },
      select: { id: true },
    });
    if (!parent) throw new BadRequestException('Parent category not found');
  }
}
