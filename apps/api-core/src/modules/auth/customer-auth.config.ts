import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../../database/prisma.service';

/**
 * Customer Auth Instance
 *
 * Quản lý xác thực cho Customers của từng Shop (multi-tenant).
 * Sử dụng các bảng: customers, customer_sessions, customer_accounts, customer_verifications.
 * Được mount tại: /api/auth/customer/*
 */
export function createCustomerAuth(prisma: PrismaService) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    user: {
      modelName: 'customer',
    },
    session: {
      modelName: 'customerSession',
      fields: {
        userId: 'customerId',
      },
    },
    account: {
      modelName: 'customerAccount',
      fields: {
        userId: 'customerId',
        expiresAt: 'accessTokenExpiresAt',
      },
    },
    verification: {
      modelName: 'customerVerification',
    },
    emailAndPassword: {
      enabled: true,
      // autoSignInAfterSignUp is not in 1.x
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    basePath: '/api/auth/customer',
    trustedOrigins: [
      process.env.STOREFRONT_URL || 'http://localhost:3002',
    ],
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      // Cookie prefix riêng cho customer
      cookiePrefix: 'customer',
    },
  });
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
