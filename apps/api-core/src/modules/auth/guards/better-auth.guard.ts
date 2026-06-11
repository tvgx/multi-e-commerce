import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../../database/prisma.service';

/**
 * BetterAuthGuard
 *
 * Guard chính bảo vệ tất cả các endpoints trong api-core.
 * Chiến lược: Kiểm tra session từ Better Auth thông qua AuthService.
 *
 * Sử dụng:
 *   - @UseGuards(BetterAuthGuard) trên Controller/Method
 *   - @Public() để bỏ qua guard cho các endpoint public
 *
 * Guard sẽ tự động xác định loại session (owner/customer)
 * dựa trên cookie prefix hoặc header 'x-auth-type'.
 */
@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Bỏ qua nếu endpoint được đánh dấu @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;

    // Xác định loại auth cần kiểm tra
    // Ưu tiên header 'x-auth-type', fallback kiểm tra cả hai
    const authType = request.headers['x-auth-type'] as string | undefined;

    let session: {
      user: Record<string, unknown>;
      session: Record<string, unknown>;
    } | null = null;

    if (authType === 'customer') {
      session = await this.authService.getCustomerSession(request);
    } else if (authType === 'owner' || !authType) {
      // Default: kiểm tra owner session
      session = await this.authService.getOwnerSession(request);
    }

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Gắn user vào request để các decorator CurrentUser() có thể truy cập
    (request as any).user = session.user;
    (request as any).session = session.session;
    (request as any).authType = authType || 'owner';

    // Lấy danh sách shopIds mà user làm owner.
    // Cache 5 phút để tránh query shops trên mỗi request — invalidate
    // khi tạo shop mới (xem ShopService.createShop).
    if ((request as any).authType === 'owner') {
      const userId = session.user.id as string;
      const cacheKey = `user:${userId}:shopIds`;
      let shopIds: string[] | undefined;

      try {
        shopIds = await this.cacheManager.get<string[]>(cacheKey);
      } catch {
        shopIds = undefined;
      }

      if (!shopIds) {
        const shops = await this.prisma.shop.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        shopIds = shops.map((s: { id: string }) => s.id);
        try {
          await this.cacheManager.set(cacheKey, shopIds, 300000);
        } catch {
          // Cache failure không được chặn request
        }
      }

      (request as any).shopIds = shopIds;
    }

    return true;
  }
}
