import { Controller, Get, Post, Put, Delete, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private extractSessionId(headers: any): string {
    const sessionId = headers['x-session-id'] || headers['authorization']?.split(' ')[1];
    if (!sessionId) {
      throw new BadRequestException('Session ID is required (x-session-id header or Bearer token)');
    }
    return sessionId;
  }

  @Get(':shopId')
  async getCart(
    @Param('shopId') shopId: string,
    @Headers() headers: any
  ) {
    const sessionId = this.extractSessionId(headers);
    const cart = await this.cartService.getCart(shopId, sessionId);
    return BaseResponseDto.success(cart);
  }

  @Post(':shopId/items')
  async addItem(
    @Param('shopId') shopId: string,
    @Headers() headers: any,
    @Body() dto: AddToCartDto
  ) {
    const sessionId = this.extractSessionId(headers);
    const cart = await this.cartService.addItem(shopId, sessionId, dto);
    return BaseResponseDto.success(cart);
  }

  @Put(':shopId/items/:productId/:variantId')
  async updateItemQuantity(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Headers() headers: any,
    @Body() dto: UpdateCartItemDto
  ) {
    const sessionId = this.extractSessionId(headers);
    const cart = await this.cartService.updateItemQuantity(shopId, sessionId, productId, variantId, dto.quantity);
    return BaseResponseDto.success(cart);
  }

  @Delete(':shopId/items/:productId/:variantId')
  async removeItem(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Headers() headers: any
  ) {
    const sessionId = this.extractSessionId(headers);
    const cart = await this.cartService.removeItem(shopId, sessionId, productId, variantId);
    return BaseResponseDto.success(cart);
  }

  @Delete(':shopId/clear')
  async clearCart(
    @Param('shopId') shopId: string,
    @Headers() headers: any
  ) {
    const sessionId = this.extractSessionId(headers);
    await this.cartService.clearCart(shopId, sessionId);
    return BaseResponseDto.success(null);
  }
}
