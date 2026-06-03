import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
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

    // Lấy danh sách shopIds mà user làm owner
    if ((request as any).authType === 'owner') {
      const shops = await this.prisma.shop.findMany({
        where: { ownerId: session.user.id as string },
        select: { id: true },
      });
      (request as any).shopIds = shops.map((s: { id: string }) => s.id);
    }

    return true;
  }
}
