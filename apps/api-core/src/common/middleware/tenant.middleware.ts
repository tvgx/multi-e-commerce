import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { PrismaService } from '../../database/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Check for explicit header first
    let shopId = req.headers['x-shop-id'] || req.headers['x-tenant-id'];

    // 2. If no header, try to extract from Host/Origin domain
    if (!shopId) {
      const host = req.headers['host'] || req.headers['origin'];
      if (host) {
        // e.g. "duck.myapp.com" -> extract "duck"
        const hostname = host.replace(/^https?:\/\//, '').split(':')[0];
        const parts = hostname.split('.');
        
        // If it's a subdomain (length > 2 usually, assuming myapp.com is base)
        // Note: In real production, check against your base domain env var
        if (parts.length >= 3) {
          const subdomain = parts[0];
          const cacheKey = `domain:${subdomain}`;
          
          try {
            // 1. Try get from Redis Cache
            const cachedShop = await this.cacheManager.get<{ id: string, status: string }>(cacheKey);
            if (cachedShop) {
              if (cachedShop.status === 'SUSPENDED') {
                 res.status(403).json({ message: 'Shop is suspended' });
                 return;
              }
              shopId = cachedShop.id;
            } else {
              // 2. Query DB
              const shop = await this.prisma.shop.findUnique({
                where: { domain: subdomain },
                select: { id: true, status: true }
              });
              
              if (shop) {
                if (shop.status === 'SUSPENDED') {
                   res.status(403).json({ message: 'Shop is suspended' });
                   return;
                }
                
                // Cache for 5 minutes
                await this.cacheManager.set(cacheKey, shop, 300000);
                shopId = shop.id;
              }
            }
          } catch (e) {
            // Ignore DB errors here, fallback to no shopId
          }
        }
      }
    } else {
      // If shopId provided explicitly, we also should check status.
      const cacheKey = `shop:${shopId}:status`;
      try {
        let status = await this.cacheManager.get<string>(cacheKey);
        if (!status) {
           const shop = await this.prisma.shop.findUnique({ where: { id: shopId as string }, select: { status: true } });
           if (shop) {
             status = shop.status;
             await this.cacheManager.set(cacheKey, status, 300000);
           }
        }
        if (status === 'SUSPENDED') {
           res.status(403).json({ message: 'Shop is suspended' });
           return;
        }
      } catch (e) {}
    }

    if (shopId) {
      this.tenantService.run({ shopId: shopId as string }, next);
    } else {
      next();
    }
  }
}
