import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { CartService, CartIdentity } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { OptionalStorefrontAuthGuard } from '../storefront-auth/guards/optional-storefront-auth.guard';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@UseGuards(OptionalStorefrontAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Resolve who owns this cart: a logged-in customer (req.user, set by the
   * guard) or an anonymous guest identified by the `x-cart-token` header.
   */
  private getIdentity(req: any): CartIdentity {
    const customerId = req.user?.id;
    if (customerId) return { customerId };
    const guestToken = req.headers['x-cart-token'];
    if (typeof guestToken === 'string' && guestToken.length > 0) {
      return { guestToken };
    }
    throw new UnauthorizedException('Cart session required (login or guest token)');
  }

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(this.getIdentity(req));
  }

  @Post('items')
  addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(this.getIdentity(req), dto);
  }

  @Patch('items/:itemId')
  updateItem(@Req() req: any, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(this.getIdentity(req), itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(this.getIdentity(req), itemId);
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(this.getIdentity(req));
  }

  /**
   * Merge a guest cart into the authenticated customer's cart. Called by the
   * storefront right after login/register. Requires a real customer session.
   */
  @Post('merge')
  @UseGuards(StorefrontAuthGuard)
  mergeGuestCart(@Req() req: any, @Body() body: { guestToken?: string }) {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return this.cartService.mergeGuestCart(customerId, body?.guestToken ?? '');
  }
}
