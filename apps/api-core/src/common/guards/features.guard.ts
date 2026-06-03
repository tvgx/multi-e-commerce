import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from '../decorators/features.decorator';
import { TenantService } from '../services/tenant.service';
import { PrismaService } from '../../database/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) return false;

    const cacheKey = `shop:${tenantId}:features`;
    let shopFeatures: string[] | undefined;

    try {
      shopFeatures = await this.cacheManager.get<string[]>(cacheKey);
      
      if (!shopFeatures) {
        const features = await this.prisma.shopFeature.findMany({
          where: { shopId: tenantId },
          select: { feature: true },
        });
        
        shopFeatures = features.map((f: { feature: string }) => f.feature);
        // Cache for 10 minutes
        await this.cacheManager.set(cacheKey, shopFeatures, 600000);
      }
    } catch (error) {
      // Fallback to empty features on cache/DB failure
      shopFeatures = [];
    }

    return requiredFeatures.every(feature => shopFeatures!.includes(feature));
  }
}
