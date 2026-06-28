import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface ListProductsQuery {
  search?: string;
  shopId?: string;
  page?: string | number;
  limit?: string | number;
}

type DistributeOutcome = 'created' | 'skipped' | 'error';

interface DistributeResult {
  shopId: string;
  status: DistributeOutcome;
  reason?: string;
  productId?: string;
}

/**
 * Catalog cấp nền tảng (P1-1): quản lý sản phẩm xuyên suốt TẤT CẢ shop mà người
 * dùng sở hữu, và "phân phối" (sao chép) một sản phẩm sang nhiều shop khác —
 * hiện thực "tạo một lần, dùng ở nhiều cửa hàng".
 *
 * Owner-scoped (theo req.user.id), KHÁC CatalogService (tenant-scoped theo
 * x-shop-id). Tái dùng schema Product/Variant hiện có — không thêm bảng mới.
 */
@Injectable()
export class PlatformCatalogService {
  private readonly logger = new Logger(PlatformCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getOwnedShops(ownerId: string): Promise<{ id: string; name: string }[]> {
    if (!ownerId) throw new BadRequestException('Owner context is missing');
    return this.prisma.shop.findMany({
      where: { ownerId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Danh sách sản phẩm gộp trên mọi shop của owner (kèm nhãn shop + giá thấp nhất). */
  async listAllProducts(ownerId: string, query: ListProductsQuery) {
    const shops = await this.getOwnedShops(ownerId);
    const shopIds = shops.map((s) => s.id);
    const shopNameById = new Map(shops.map((s) => [s.id, s.name]));

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 24, 100);

    if (shopIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
        shops,
      };
    }

    const skip = (page - 1) * limit;
    const where: any = { shopId: { in: shopIds } };
    // Lọc theo 1 shop cụ thể (nếu hợp lệ & thuộc sở hữu)
    if (query.shopId && shopIds.includes(query.shopId)) {
      where.shopId = query.shopId;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { variants: { select: { price: true, currency: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = items.map((p) => {
      const prices = p.variants.map((v) => v.price);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        imageUrl: p.imageUrl ?? p.images?.[0] ?? null,
        shopId: p.shopId,
        shopName: shopNameById.get(p.shopId) ?? '',
        variantCount: p.variants.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        currency: p.variants[0]?.currency ?? 'VND',
        createdAt: p.createdAt,
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      shops,
    };
  }

  /**
   * Sao chép một sản phẩm (kèm các biến thể) sang nhiều shop đích của cùng owner.
   * - Bỏ qua shop đã có sản phẩm trùng slug (không ghi đè).
   * - SKU là duy nhất theo shop → tự thêm hậu tố nếu trùng.
   * - categoryId không map tự động (category riêng từng shop) → để trống.
   * - Sản phẩm sao chép luôn ở trạng thái DRAFT để chủ shop kiểm tra trước.
   */
  async distributeProduct(
    ownerId: string,
    productId: string,
    targetShopIds: string[],
  ) {
    if (!Array.isArray(targetShopIds) || targetShopIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một cửa hàng đích');
    }

    const shops = await this.getOwnedShops(ownerId);
    const ownedIds = new Set(shops.map((s) => s.id));

    const source = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!source || !ownedIds.has(source.shopId)) {
      throw new NotFoundException('Không tìm thấy sản phẩm nguồn');
    }

    // Chỉ giữ shop đích hợp lệ (thuộc owner, khác shop nguồn, không trùng lặp)
    const targets = [...new Set(targetShopIds)].filter(
      (id) => ownedIds.has(id) && id !== source.shopId,
    );
    if (targets.length === 0) {
      throw new BadRequestException('Cửa hàng đích không hợp lệ');
    }

    const results: DistributeResult[] = [];
    for (const targetShopId of targets) {
      try {
        const existing = await this.prisma.product.findUnique({
          where: { shopId_slug: { shopId: targetShopId, slug: source.slug } },
          select: { id: true },
        });
        if (existing) {
          results.push({
            shopId: targetShopId,
            status: 'skipped',
            reason: 'Đã có sản phẩm cùng đường dẫn (slug)',
          });
          continue;
        }

        const clonedVariants = await this.buildClonedVariants(
          targetShopId,
          source.variants,
        );

        const created = await this.prisma.product.create({
          data: {
            shopId: targetShopId,
            name: source.name,
            slug: source.slug,
            description: source.description,
            categoryId: null,
            imageUrl: source.imageUrl,
            images: source.images,
            status: 'DRAFT',
            variants: clonedVariants.length
              ? { create: clonedVariants }
              : undefined,
          },
          select: { id: true },
        });
        results.push({
          shopId: targetShopId,
          status: 'created',
          productId: created.id,
        });
      } catch (err) {
        this.logger.error(
          `Distribute ${productId} → ${targetShopId} failed: ${(err as Error).message}`,
        );
        results.push({
          shopId: targetShopId,
          status: 'error',
          reason: 'Lỗi khi sao chép sản phẩm',
        });
      }
    }

    return {
      sourceProductId: productId,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      total: targets.length,
      results,
    };
  }

  private async buildClonedVariants(
    targetShopId: string,
    variants: {
      sku: string;
      price: number;
      weight: number | null;
      currency: string;
    }[],
  ) {
    const out: any[] = [];
    const usedSkus = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      let sku = v.sku;
      let attempt = 0;
      // SKU duy nhất theo shop: thêm hậu tố nếu DB đã có hoặc trùng trong batch.
      while (
        usedSkus.has(sku) ||
        (await this.prisma.variant.findUnique({
          where: { shopId_sku: { shopId: targetShopId, sku } },
          select: { id: true },
        }))
      ) {
        attempt++;
        sku = `${v.sku}-${attempt}`;
      }
      usedSkus.add(sku);
      out.push({
        shopId: targetShopId,
        sku,
        price: v.price,
        weight: v.weight,
        currency: v.currency || 'VND',
        isMaster: i === 0,
      });
    }
    return out;
  }
}
