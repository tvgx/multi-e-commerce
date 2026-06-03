import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Nếu endpoint yêu cầu OWNER, cần check xem user có quyền trên shop hiện tại không
    if (requiredRoles.includes('OWNER' as any) && request.shopIds) {
      const tenantId = this.tenantService.getTenantId();
      if (tenantId && !request.shopIds.includes(tenantId)) {
        return false; // Có session owner nhưng không phải của shop này
      }
      return true; // Hợp lệ
    }

    // Fallback cho ADMIN (nếu có enum role)
    return user && requiredRoles.includes(user.role || 'OWNER');
  }
}
