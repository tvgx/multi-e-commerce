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
      // Lưu session data trong signed cookie 5 phút — tránh query DB
      // (customer_sessions + customers) trên mỗi request. Trade-off:
      // revoke session có hiệu lực trễ tối đa maxAge giây.
      cookieCache: {
        enabled: true,
        maxAge: 300,
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
    trustedOrigins: [process.env.STOREFRONT_URL || 'http://localhost:3002'],
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      // Cookie prefix riêng cho customer
      cookiePrefix: 'customer',
      // Production: COOKIE_DOMAIN=.tvgx1.id.vn để cookie customer hợp lệ trên
      // mọi storefront subdomain (shop1.tvgx1.id.vn …) khi gọi api.tvgx1.id.vn.
      // Bỏ trống ở local → cookie host-only như cũ.
      ...(process.env.COOKIE_DOMAIN
        ? { crossSubDomainCookies: { enabled: true, domain: process.env.COOKIE_DOMAIN } }
        : {}),
    },
  });
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
