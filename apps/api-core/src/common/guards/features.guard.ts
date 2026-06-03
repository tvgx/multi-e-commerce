import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from '../decorators/features.decorator';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) return false;

    // TODO: Ideally, fetch the tenant's subscribed features from Cache or DB.
    // For now, assuming a mocked feature set on the request or tenant context.
    // Replace this logic with actual subscription check.
    const shopFeatures = ['basic_analytics', 'chat']; // Mocked

    return requiredFeatures.every(feature => shopFeatures.includes(feature));
  }
}
