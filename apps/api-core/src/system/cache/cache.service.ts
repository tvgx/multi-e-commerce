import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemCacheService {
  private readonly logger = new Logger(SystemCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Revalidates Next.js Storefront ISR cache based on tag
   * @param tag The tag to revalidate (e.g. 'layout-shop123')
   */
  async revalidateStorefront(tag: string): Promise<boolean> {
    const storefrontUrl = this.configService.get<string>('STOREFRONT_URL');
    const secret = this.configService.get<string>('REVALIDATE_SECRET');

    if (!storefrontUrl || !secret) {
      this.logger.warn('STOREFRONT_URL or REVALIDATE_SECRET is missing. Cannot revalidate storefront.');
      return false;
    }

    try {
      const url = `${storefrontUrl}/api/revalidate?tag=${tag}&secret=${secret}`;
      this.logger.log(`Revalidating Storefront Cache: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
      });

      if (!response.ok) {
        this.logger.error(`Failed to revalidate storefront for tag [${tag}]. Status: ${response.status}`);
        return false;
      }

      this.logger.log(`Storefront revalidation successful for tag [${tag}]`);
      return true;
    } catch (error) {
      this.logger.error(`Error requesting storefront revalidation for tag [${tag}]`, error.message);
      return false;
    }
  }
}
