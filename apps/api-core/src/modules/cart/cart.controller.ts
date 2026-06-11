import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { StorefrontAuthGuard } from '../storefront-auth/guards/storefront-auth.guard';

@UseGuards(StorefrontAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getCustomerId(req: any): string {
    const customerId = req.user?.id;
    if (!customerId) throw new UnauthorizedException('Authentication required');
    return customerId;
  }

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(this.getCustomerId(req));
  }

  @Post('items')
  addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(this.getCustomerId(req), dto);
  }

  @Patch('items/:itemId')
  updateItem(@Req() req: any, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(this.getCustomerId(req), itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(this.getCustomerId(req), itemId);
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(this.getCustomerId(req));
  }
}
