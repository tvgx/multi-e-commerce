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

      // Prefer the default location's stock item per variant
      const byVariant = new Map<string, any>();
      for (const si of stockItems) {
        const current = byVariant.get(si.variantId);
        if (!current || (si.stockLocation.isDefault && !current.stockLocation.isDefault)) {
          byVariant.set(si.variantId, si);
        }
      }

      const stockItemTargets = items.map((item) => {
        const stockItem = byVariant.get(item.variantId);
        if (!stockItem) {
          throw new BadRequestException(`Variant ${item.variantId} has no stock locations`);
        }
        return { stockItemId: stockItem.id, ...item };
      });

      // Sort by stockItemId to prevent deadlocks when locking multiple rows
      stockItemTargets.sort((a, b) => a.stockItemId.localeCompare(b.stockItemId));

      for (const target of stockItemTargets) {
        // Lock row using Raw SQL (PostgreSQL)
        const lockedRows = await tx.$queryRawUnsafe(`
          SELECT id, "countOnHand", "backorderable" 
          FROM stock_items 
          WHERE id = $1
          FOR UPDATE
        `, target.stockItemId);

        if (!lockedRows || lockedRows.length === 0) {
           throw new InternalServerErrorException('Failed to lock stock row');
        }

        const lockedItem = lockedRows[0];

        if (!lockedItem.backorderable && lockedItem.countOnHand < target.quantity) {
          throw new BadRequestException(`Insufficient stock for variant ${target.variantId}`);
        }

        // Update count
        await tx.stockItem.update({
          where: { id: lockedItem.id },
          data: { countOnHand: { decrement: target.quantity } }
        });

        // Record movement
        await tx.stockMovement.create({
          data: {
             shopId,
             variantId: target.variantId,
             stockItemId: lockedItem.id,
             quantityDelta: -target.quantity,
             reason: 'order_fulfillment',
             orderId,
          }
        });
      }
      return true;
    };

    // Interactive transaction clients don't expose $transaction — when a tx
    // is passed in (checkout flow) we must run on it directly.
    if (txPrisma) return run(txPrisma);
    return this.prisma.$transaction(run);
  }

  async restoreStock(orderId: string, txPrisma?: any) {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context required');

    const run = async (tx: any) => {
      const movements = await tx.stockMovement.findMany({
        where: { shopId, orderId, reason: 'order_fulfillment' }
      });

      for (const movement of movements) {
         await tx.stockItem.update({
            where: { id: movement.stockItemId },
            data: { countOnHand: { increment: Math.abs(movement.quantityDelta) } }
         });

         await tx.stockMovement.create({
            data: {
               shopId,
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
