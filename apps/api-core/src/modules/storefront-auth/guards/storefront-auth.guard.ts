import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyJwt } from '../jwt.utils';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class StorefrontAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    // verifyJwt tự ném UnauthorizedException (401) khi token hỏng. Lỗi DB
    // (prisma) bên dưới KHÔNG bị che thành 401 — nổi lên filter với mã của nó.
    const payload = verifyJwt(token);

    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    // Attach customer to request
    request.user = { id: customer.id, email: customer.email, shopId: customer.shopId };
    return true;
  }
}
