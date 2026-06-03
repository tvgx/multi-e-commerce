import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CartItemDto } from './dto/cart.dto';

export interface CartData {
  items: CartItemDto[];
  totalAmount: number;
}

@Injectable()
export class CartService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;
  private redisAvailable = false;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.redisClient.on('connect', () => {
      this.redisAvailable = true;
    });

    this.redisClient.on('close', () => {
      this.redisAvailable = false;
    });

    // Prevent ioredis from emitting noisy unhandled errors when Redis is down.
    this.redisClient.on('error', () => {
      this.redisAvailable = false;
    });

    void this.redisClient.connect().catch(() => {
      this.redisAvailable = false;
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  private getCartKey(shopId: string, sessionId: string): string {
    return `cart:${shopId}:${sessionId}`;
  }

  private calculateTotal(items: CartItemDto[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async getCart(shopId: string, sessionId: string): Promise<CartData> {
    if (!this.redisAvailable) return { items: [], totalAmount: 0 };

    const key = this.getCartKey(shopId, sessionId);
    const data = await this.redisClient.get(key);

    if (!data) return { items: [], totalAmount: 0 };
    return JSON.parse(data) as CartData;
  }

  async addItem(
    shopId: string,
    sessionId: string,
    newItem: CartItemDto,
  ): Promise<CartData> {
    const cart = await this.getCart(shopId, sessionId);
    const key = this.getCartKey(shopId, sessionId);

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId === newItem.productId &&
        item.variantId === newItem.variantId,
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += newItem.quantity;
    } else {
      cart.items.push(newItem);
    }

    cart.totalAmount = this.calculateTotal(cart.items);

    if (!this.redisAvailable) {
      return cart;
    }

    // Store in Redis (expires in 7 days)
    await this.redisClient.set(
      key,
      JSON.stringify(cart),
      'EX',
      7 * 24 * 60 * 60,
    );

    return cart;
  }

  async updateItemQuantity(
    shopId: string,
    sessionId: string,
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartData> {
    const cart = await this.getCart(shopId, sessionId);
    const key = this.getCartKey(shopId, sessionId);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId && item.variantId === variantId,
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity = quantity;
      cart.totalAmount = this.calculateTotal(cart.items);
      if (!this.redisAvailable) {
        return cart;
      }
      await this.redisClient.set(
        key,
        JSON.stringify(cart),
        'EX',
        7 * 24 * 60 * 60,
      );
    }

    return cart;
  }

  async removeItem(
    shopId: string,
    sessionId: string,
    productId: string,
    variantId: string,
  ): Promise<CartData> {
    const cart = await this.getCart(shopId, sessionId);
    const key = this.getCartKey(shopId, sessionId);

    cart.items = cart.items.filter(
      (item) => !(item.productId === productId && item.variantId === variantId),
    );

    cart.totalAmount = this.calculateTotal(cart.items);
    if (!this.redisAvailable) {
      return cart;
    }
    await this.redisClient.set(
      key,
      JSON.stringify(cart),
      'EX',
      7 * 24 * 60 * 60,
    );

    return cart;
  }

  async clearCart(shopId: string, sessionId: string): Promise<void> {
    if (!this.redisAvailable) return;

    const key = this.getCartKey(shopId, sessionId);
    await this.redisClient.del(key);
  }
}
