import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

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

  /** Lấy (hoặc tạo) giỏ của khách trên shop hiện tại. */
  private async getOrCreateCart(customerId: string) {
    const shopId = this.getShopId();
    return this.prisma.cart.upsert({
      where: { shopId_customerId: { shopId, customerId } },
      create: { shopId, customerId },
      update: {},
    });
  }

  async getCart(customerId: string) {
    const cart = await this.getOrCreateCart(customerId);

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

  async addItem(customerId: string, dto: AddCartItemDto) {
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

    const cart = await this.getOrCreateCart(customerId);

    const item = await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
      create: { cartId: cart.id, variantId: dto.variantId, quantity: dto.quantity },
      update: { quantity: { increment: dto.quantity } },
    });

    return { status: 'added', item };
  }

  async updateItem(customerId: string, itemId: string, dto: UpdateCartItemDto) {
    if (!Number.isInteger(dto.quantity) || dto.quantity < 0) {
      throw new BadRequestException('Quantity must be a non-negative integer');
    }

    const cart = await this.getOrCreateCart(customerId);

    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: existing.id } });
      return { status: 'removed', itemId };
    }

    const item = await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: dto.quantity },
    });
    return { status: 'updated', item };
  }

  async removeItem(customerId: string, itemId: string) {
    const cart = await this.getOrCreateCart(customerId);

    const { count } = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    if (count === 0) throw new NotFoundException('Cart item not found');
    return { status: 'removed', itemId };
  }

  async clearCart(customerId: string) {
    const cart = await this.getOrCreateCart(customerId);
    const { count } = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { status: 'cleared', count };
  }
}
