import { Module, Global } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';
import { createOwnerAuth } from './owner-auth.config';
import { createCustomerAuth } from './customer-auth.config';
import { BetterAuthGuard } from './guards/better-auth.guard';
import { OWNER_AUTH, CUSTOMER_AUTH } from './auth.constants';

@Global()
@Module({
  imports: [DatabaseModule, EmailModule],
  providers: [
    // Factory provider cho Owner Auth instance.
    // Inject EmailService để better-auth gửi được email reset mật khẩu owner.
    {
      provide: OWNER_AUTH,
      useFactory: (prisma: PrismaService, email: EmailService) =>
        createOwnerAuth(prisma, email),
      inject: [PrismaService, EmailService],
    },
    // Factory provider cho Customer Auth instance
    {
      provide: CUSTOMER_AUTH,
      useFactory: (prisma: PrismaService) => createCustomerAuth(prisma),
      inject: [PrismaService],
    },
    AuthService,
    BetterAuthGuard,
    Reflector,
  ],
  controllers: [AuthController],
  exports: [AuthService, BetterAuthGuard, OWNER_AUTH, CUSTOMER_AUTH],
})
export class AuthModule {}
