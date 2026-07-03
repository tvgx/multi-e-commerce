import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { verifyJwt } from '../jwt.utils';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Like StorefrontAuthGuard, but does NOT reject unauthenticated requests.
 *
 * If a valid Bearer token is present, attaches `request.user`; otherwise lets
 * the request through with no user. Used by guest-capable endpoints (cart),
 * where an anonymous caller falls back to a guest identity (x-cart-token).
 */
@Injectable()
export class OptionalStorefrontAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true; // anonymous — no user attached
    }

    const token = authHeader.split(' ')[1];

    // A malformed/expired token should not silently fall back to guest — that
    // would hide a broken session. verifyJwt throws UnauthorizedException.
    const payload = verifyJwt(token);

    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
    });

    if (customer) {
      request.user = {
        id: customer.id,
        email: customer.email,
        shopId: customer.shopId,
      };
    }
    return true;
  }
}
