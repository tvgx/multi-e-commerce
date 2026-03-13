import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, pass: string) {
    // Optimization: query specific fields, avoid loading extra relationships
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (user && user.passwordHash === pass) {
      // Basic mock for bcrypt match
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result; // return JWT payload ideally
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  login(user: unknown) {
    return {
      access_token: 'mock-jwt-token-123456',
      user,
    };
  }
}
