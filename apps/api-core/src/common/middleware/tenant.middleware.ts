import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
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
          try {
            const shop = await this.prisma.shop.findUnique({
              where: { domain: subdomain },
            });
            if (shop) {
              shopId = shop.id;
            }
          } catch (e) {
            // Ignore DB errors here, fallback to no shopId
          }
        }
      }
    }

    if (shopId) {
      this.tenantService.run({ shopId: shopId as string }, next);
    } else {
      next();
    }
  }
}
