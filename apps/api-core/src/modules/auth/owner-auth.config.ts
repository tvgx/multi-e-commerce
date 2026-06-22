import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../../database/prisma.service';

/**
 * Owner / Admin Auth Instance
 *
 * Quản lý xác thực cho các User có vai trò ADMIN hoặc OWNER.
 * Sử dụng các bảng: users, sessions, accounts, verifications (Better Auth standard).
 * Được mount tại: /api/auth/owner/*
 */
export function createOwnerAuth(prisma: PrismaService) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      autoSignInAfterSignUp: true,
      // Có thể bật email verification sau:
      // requireEmailVerification: true,
    },
    session: {
      // Lưu session data trong signed cookie 5 phút — tránh query DB
      // (sessions + users) trên mỗi request. Trade-off: revoke session
      // có hiệu lực trễ tối đa maxAge giây.
      cookieCache: {
        enabled: true,
        maxAge: 300,
      },
    },
    // Thêm social providers tại đây nếu cần:
    // socialProviders: {
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   },
    // },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    basePath: '/api/auth/owner',
    trustedOrigins: [
      process.env.ADMIN_URL || 'http://localhost:3001',
      process.env.STOREFRONT_URL || 'http://localhost:3002',
    ],
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      // Cookie prefix để phân biệt với customer sessions
      cookiePrefix: 'owner',
      // Production: đặt COOKIE_DOMAIN=.tvgx1.id.vn để cookie được chia sẻ giữa
      // admin.tvgx1.id.vn ↔ api.tvgx1.id.vn (cùng eTLD+1 nên là same-site).
      // Bỏ trống ở local → cookie host-only như cũ.
      crossSubDomainCookies: process.env.COOKIE_DOMAIN
        ? { enabled: true, domain: process.env.COOKIE_DOMAIN }
        : { enabled: false, domain: 'localhost' },
    },
  });
}

export type OwnerAuth = ReturnType<typeof createOwnerAuth>;
