import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

/**
 * Who owns a cart: a logged-in customer (customerId) OR an anonymous guest
 * session (guestToken). Exactly one is set; the controller resolves it from the
 * Bearer token or the `x-cart-token` header.
 */
export interface CartIdentity {
  customerId?: string;
  guestToken?: string;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  /** Lấy (hoặc tạo) giỏ của khách/guest trên shop hiện tại. */
  private async getOrCreateCart(identity: CartIdentity) {
    const shopId = this.getShopId();

    if (identity.customerId) {
      return this.prisma.cart.upsert({
        where: { shopId_customerId: { shopId, customerId: identity.customerId } },
        create: { shopId, customerId: identity.customerId },
        update: {},
      });
    }
    if (identity.guestToken) {
      return this.prisma.cart.upsert({
        where: { shopId_guestToken: { shopId, guestToken: identity.guestToken } },
        create: { shopId, guestToken: identity.guestToken },
        update: {},
      });
    }
    throw new BadRequestException('Cart identity is missing (login or guest token required)');
  }

  async getCart(identity: CartIdentity) {
    const cart = await this.getOrCreateCart(identity);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { createdAt: 'asc' },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            price: true,
            currency: true,
            product: {
              select: { id: true, name: true, slug: true, imageUrl: true, status: true },
            },
          },
        },
      },
    });

    const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

    return {
      data: {
        id: cart.id,
        items,
        subtotal,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  }

  async addItem(identity: CartIdentity, dto: AddCartItemDto) {
    const shopId = this.getShopId();

    // App không bật global ValidationPipe nên DTO decorators không chạy — check tay
    if (!Number.isInteger(dto.quantity) || dto.quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    // Only PUBLISHED products are buyable — block adding DRAFT/ARCHIVED variants
    // to the cart (CART-1, mirrors the order.createOrder guard for ORD-5).
    const variant = await this.prisma.variant.findFirst({
      where: { id: dto.variantId, shopId, product: { status: 'PUBLISHED' } },
    });
    if (!variant) throw new BadRequestException('Variant not found or not available for purchase');

    const cart = await this.getOrCreateCart(identity);

    // TODO 8: chặn thêm vượt tồn kho ngay từ giỏ hàng (trước đây chỉ chặn lúc
    // đặt hàng → khách chỉ biết hết hàng ở bước checkout). Tính cả số lượng đã
    // nằm sẵn trong giỏ. Variant không theo dõi kho / backorderable thì bỏ qua.
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });
    await this.assertStockAvailable(dto.variantId, (existing?.quantity ?? 0) + dto.quantity, shopId);

    const item = await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
      create: { cartId: cart.id, variantId: dto.variantId, quantity: dto.quantity },
      update: { quantity: { increment: dto.quantity } },
    });

    return { status: 'added', item };
  }

  /** Ném INSUFFICIENT_STOCK nếu tổng số lượng yêu cầu vượt tồn kho khả dụng (TODO 8). */
  private async assertStockAvailable(variantId: string, requestedTotal: number, shopId: string) {
    const stockItems = await this.prisma.stockItem.findMany({
      where: { variantId, stockLocation: { shopId } },
      select: { countOnHand: true, backorderable: true },
    });
    // Không có bản ghi kho = không theo dõi; có nơi cho backorder = không chặn.
    if (stockItems.length === 0 || stockItems.some((si) => si.backorderable)) return;

    const available = stockItems.reduce((acc, si) => acc + si.countOnHand, 0);
    if (requestedTotal > available) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        available,
        message: `Insufficient stock: only ${available} available`,
      });
    }
  }

  async updateItem(identity: CartIdentity, itemId: string, dto: UpdateCartItemDto) {
    if (!Number.isInteger(dto.quantity) || dto.quantity < 0) {
      throw new BadRequestException('Quantity must be a non-negative integer');
    }

    const cart = await this.getOrCreateCart(identity);

    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: existing.id } });
      return { status: 'removed', itemId };
    }

    // Guard tồn kho khi tăng số lượng trực tiếp trong giỏ.
    await this.assertStockAvailable(existing.variantId, dto.quantity, this.getShopId());

    const item = await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: dto.quantity },
    });
    return { status: 'updated', item };
  }

  async removeItem(identity: CartIdentity, itemId: string) {
    const cart = await this.getOrCreateCart(identity);

    const { count } = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    if (count === 0) throw new NotFoundException('Cart item not found');
    return { status: 'removed', itemId };
  }

  async clearCart(identity: CartIdentity) {
    const cart = await this.getOrCreateCart(identity);
    const { count } = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { status: 'cleared', count };
  }

  /**
   * Gộp giỏ guest vào giỏ của khách sau khi đăng nhập/đăng ký. Item trùng
   * variant thì cộng dồn quantity; sau đó xoá giỏ guest. No-op nếu guest chưa
   * có giỏ. Chạy trong transaction để không mất item giữa chừng.
   */
  async mergeGuestCart(customerId: string, guestToken: string) {
    if (!guestToken) return { status: 'noop', merged: 0 };
    const shopId = this.getShopId();

    const guestCart = await this.prisma.cart.findUnique({
      where: { shopId_guestToken: { shopId, guestToken } },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) {
      // Vẫn dọn giỏ guest rỗng nếu có, để token cũ không tồn đọng.
      if (guestCart) await this.prisma.cart.delete({ where: { id: guestCart.id } });
      return { status: 'noop', merged: 0 };
    }

    const customerCart = await this.getOrCreateCart({ customerId });

    await this.prisma.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        await tx.cartItem.upsert({
          where: { cartId_variantId: { cartId: customerCart.id, variantId: item.variantId } },
          create: { cartId: customerCart.id, variantId: item.variantId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        });
      }
      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    return { status: 'merged', merged: guestCart.items.length };
  }
}
