import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';

export interface DecrementStockItem {
  variantId: string;
  quantity: number;
}

export class AdjustStockDto {
  variantId: string;
  stockLocationId: string;
  quantityDelta: number;
  reason: string;
}

export class RestockItemDto {
  variantId: string;
  stockLocationId: string;
  quantity: number;
  reason?: string;
}

export class BulkRestockDto {
  items: RestockItemDto[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async getVariantStock(variantId: string) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');

    const stockItems = await this.prisma.stockItem.findMany({
      where: { variantId, stockLocation: { shopId } },
      include: { stockLocation: true },
    });

    const totalCount = stockItems.reduce((acc, item) => acc + item.countOnHand, 0);
    return {
      variantId,
      totalCount,
      locations: stockItems,
    };
  }

  async decrementStock(items: DecrementStockItem[], orderId: string, txPrisma?: any) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');

    const run = async (tx: any) => {
      // Batch-load stock items for all variants in one query (the previous
      // version ran up to two queries per line item, sequentially, while
      // holding the checkout transaction open)
      const variantIds = items.map((i) => i.variantId);
      const stockItems = await tx.stockItem.findMany({
        where: { variantId: { in: variantIds }, stockLocation: { shopId } },
        include: { stockLocation: { select: { isDefault: true } } },
      });

      // INV-2: keep EVERY location per variant (not just the default). When the
      // default location runs out, fulfilment spills over to the other
      // locations instead of reporting "out of stock" while inventory still
      // exists elsewhere. Order per variant: default first, then stable by id.
      const byVariant = new Map<string, any[]>();
      for (const si of stockItems) {
        const list = byVariant.get(si.variantId) ?? [];
        list.push(si);
        byVariant.set(si.variantId, list);
      }
      for (const list of byVariant.values()) {
        list.sort(
          (a, b) =>
            (b.stockLocation.isDefault ? 1 : 0) -
              (a.stockLocation.isDefault ? 1 : 0) ||
            a.id.localeCompare(b.id),
        );
      }

      for (const item of items) {
        if (!byVariant.get(item.variantId)?.length) {
          throw new BadRequestException(`Variant ${item.variantId} has no stock locations`);
        }
      }

      // Lock every candidate row in one deterministic global order (by id) so
      // concurrent checkouts never deadlock on the same pair of rows.
      const lockedById = new Map<string, any>();
      const allIds = stockItems
        .map((si: any) => si.id)
        .sort((a: string, b: string) => a.localeCompare(b));
      for (const id of allIds) {
        const lockedRows = await tx.$queryRawUnsafe(
          `SELECT id, "countOnHand", "backorderable" FROM stock_items WHERE id = $1 FOR UPDATE`,
          id,
        );
        if (!lockedRows || lockedRows.length === 0) {
          throw new InternalServerErrorException('Failed to lock stock row');
        }
        lockedById.set(id, lockedRows[0]);
      }

      const applyTake = async (locked: any, variantId: string, take: number) => {
        await tx.stockItem.update({
          where: { id: locked.id },
          data: { countOnHand: { decrement: take } },
        });
        await tx.stockMovement.create({
          data: {
            shopId,
            variantId,
            stockItemId: locked.id,
            quantityDelta: -take,
            reason: 'order_fulfillment',
            orderId,
          },
        });
        // Keep the in-memory count in sync so a variant repeated across line
        // items doesn't double-spend the same on-hand units.
        locked.countOnHand -= take;
      };

      for (const item of items) {
        const locations = byVariant.get(item.variantId)!;
        const totalAvailable = locations.reduce(
          (sum, si) => sum + lockedById.get(si.id).countOnHand,
          0,
        );
        const anyBackorderable = locations.some(
          (si) => lockedById.get(si.id).backorderable,
        );
        if (totalAvailable < item.quantity && !anyBackorderable) {
          throw new BadRequestException(`Insufficient stock for variant ${item.variantId}`);
        }

        // Decide how much to pull from each location, then apply once per
        // location (one movement each). Phase 1: positive on-hand stock,
        // default location first.
        const takes = new Map<string, number>();
        let remaining = item.quantity;
        for (const si of locations) {
          if (remaining <= 0) break;
          const locked = lockedById.get(si.id);
          const take = Math.min(remaining, Math.max(locked.countOnHand, 0));
          if (take <= 0) continue;
          takes.set(si.id, take);
          remaining -= take;
        }

        // Phase 2: any shortfall is a backorder — fold it into a location that
        // allows it (guaranteed to exist by the guard above).
        if (remaining > 0) {
          const boLoc = locations.find((si) => lockedById.get(si.id).backorderable)!;
          takes.set(boLoc.id, (takes.get(boLoc.id) ?? 0) + remaining);
          remaining = 0;
        }

        for (const [stockItemId, take] of takes) {
          await applyTake(lockedById.get(stockItemId), item.variantId, take);
        }
      }
      return true;
    };

    // Interactive transaction clients don't expose $transaction — when a tx
    // is passed in (checkout flow) we must run on it directly.
    if (txPrisma) return run(txPrisma);
    return this.prisma.$transaction(run);
  }

  /**
   * Hoàn kho cho một đơn (cộng lại theo các movement `order_fulfillment`).
   *
   * - Idempotent (INV-1): nếu đơn đã có movement `order_refund` thì bỏ qua, tránh
   *   cộng kho gấp đôi khi nhiều đường huỷ cùng chạy cho 1 đơn (reject + timeout,
   *   admin huỷ + khách tự huỷ, retry job...).
   * - Không phụ thuộc tenant context: shopId lấy từ chính movement gốc nên gọi được
   *   cả từ Bull worker (payment-timeout) không có request scope. orderId là UUID
   *   định danh đơn toàn cục nên không cần lọc thêm theo shop.
   */
  async restoreStock(orderId: string, txPrisma?: any) {
    const run = async (tx: any) => {
      const alreadyRestored = await tx.stockMovement.findFirst({
        where: { orderId, reason: 'order_refund' },
      });
      if (alreadyRestored) return false;

      const movements = await tx.stockMovement.findMany({
        where: { orderId, reason: 'order_fulfillment' }
      });

      for (const movement of movements) {
         await tx.stockItem.update({
            where: { id: movement.stockItemId },
            data: { countOnHand: { increment: Math.abs(movement.quantityDelta) } }
         });

         await tx.stockMovement.create({
            data: {
               shopId: movement.shopId,
               variantId: movement.variantId,
               stockItemId: movement.stockItemId,
               quantityDelta: Math.abs(movement.quantityDelta),
               reason: 'order_refund',
               orderId,
            }
         });
      }
      return true;
    };

    if (txPrisma) return run(txPrisma);
    return this.prisma.$transaction(run);
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');

    return this.prisma.$transaction(async (tx) => {
      const stockItem = await tx.stockItem.findUnique({
        where: { stockLocationId_variantId: { stockLocationId: dto.stockLocationId, variantId: dto.variantId } }
      });

      if (!stockItem) {
        throw new BadRequestException('Stock item not found for this location');
      }

      const updated = await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { countOnHand: { increment: dto.quantityDelta } }
      });

      await tx.stockMovement.create({
        data: {
           shopId,
           variantId: dto.variantId,
           stockItemId: stockItem.id,
           quantityDelta: dto.quantityDelta,
           reason: dto.reason || 'manual_adjustment',
           userId,
        }
      });

      return updated;
    });
  }

  /**
   * Variants whose total on-hand across ALL of this shop's locations has fallen
   * to/under `threshold` — the data behind a "low stock" alert event. The sum
   * and the threshold filter are pushed to the DB (`groupBy` + `having`) so we
   * never pull the whole stock table into memory; only the (bounded) low rows
   * come back, then a single batch query enriches them with SKU/product info.
   */
  async getLowStock(threshold = 5) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw new BadRequestException('threshold must be a non-negative integer');
    }

    const grouped = await this.prisma.stockItem.groupBy({
      by: ['variantId'],
      where: { stockLocation: { shopId } },
      _sum: { countOnHand: true },
      having: { countOnHand: { _sum: { lte: threshold } } },
    });

    const variantIds = grouped.map((g: any) => g.variantId);
    if (variantIds.length === 0) {
      return { data: [], meta: { total: 0, threshold } };
    }

    const variants = await this.prisma.variant.findMany({
      where: { id: { in: variantIds }, shopId },
      select: {
        id: true,
        sku: true,
        price: true,
        product: { select: { id: true, name: true, status: true } },
      },
    });

    const byId = new Map(variants.map((v: any) => [v.id, v]));
    const data = grouped
      .map((g: any) => {
        const v: any = byId.get(g.variantId);
        if (!v) return null; // variant deleted but a stale stock row remained
        return {
          variantId: g.variantId,
          sku: v.sku,
          price: v.price,
          productId: v.product?.id,
          productName: v.product?.name,
          productStatus: v.product?.status,
          countOnHand: g._sum?.countOnHand ?? 0,
        };
      })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.countOnHand - b.countOnHand); // most urgent first

    return { data, meta: { total: data.length, threshold } };
  }

  /**
   * Restock many (variant, location) pairs in ONE transaction — the inbound
   * "goods received" event. Each line increments on-hand and writes a `restock`
   * stock movement for the audit trail. Unlike {@link adjustStock} this enforces
   * shop ownership on every stock item (the location must belong to the caller's
   * shop), and validates positive integer quantities by hand (no global
   * ValidationPipe). All-or-nothing: any bad line rolls the whole batch back.
   */
  async bulkRestock(items: RestockItemDto[], userId?: string) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }
    for (const it of items) {
      if (!it?.variantId || !it?.stockLocationId) {
        throw new BadRequestException('Each item needs variantId and stockLocationId');
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        throw new BadRequestException('Each restock quantity must be a positive integer');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const results: { variantId: string; stockItemId: string; countOnHand: number }[] = [];
      for (const it of items) {
        const stockItem = await tx.stockItem.findFirst({
          where: {
            stockLocationId: it.stockLocationId,
            variantId: it.variantId,
            stockLocation: { shopId },
          },
        });
        if (!stockItem) {
          throw new BadRequestException(
            `Stock item not found for variant ${it.variantId} at the given location`,
          );
        }

        const updated = await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { countOnHand: { increment: it.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            shopId,
            variantId: it.variantId,
            stockItemId: stockItem.id,
            quantityDelta: it.quantity,
            reason: it.reason || 'restock',
            userId,
          },
        });

        results.push({
          variantId: it.variantId,
          stockItemId: stockItem.id,
          countOnHand: updated.countOnHand,
        });
      }
      return { status: 'restocked', count: results.length, items: results };
    });
  }

  async getStockMovements(variantId: string, page = 1, limit = 20) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');

    const skip = (page - 1) * limit;
    
    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { shopId, variantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { stockItem: { include: { stockLocation: true } } }
      }),
      this.prisma.stockMovement.count({
        where: { shopId, variantId }
      })
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
