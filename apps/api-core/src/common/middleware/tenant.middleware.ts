import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const shopId = req.headers['x-shop-id'] || req.headers['x-tenant-id'];
    if (shopId) {
      this.tenantService.run({ shopId: shopId as string }, next);
    } else {
      next();
    }
  }
}
