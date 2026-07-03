import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

/**
 * Owner / Admin Auth Instance
 *
 * Quản lý xác thực cho các User có vai trò ADMIN hoặc OWNER.
 * Sử dụng các bảng: users, sessions, accounts, verifications (Better Auth standard).
 * Được mount tại: /api/auth/owner/*
 */
export function createOwnerAuth(prisma: PrismaService, emailService: EmailService) {
  // Only wire Google when both credentials are present, so a missing/empty env
  // (dev without OAuth set up) doesn't break better-auth at startup. Fill
  // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env to enable the button.
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      autoSignInAfterSignUp: true,
      // Có thể bật email verification sau:
      // requireEmailVerification: true,
      // Reset mật khẩu: better-auth tự sinh + lưu token (bảng verifications) rồi
      // gọi callback này với link đã kèm token & callbackURL (redirectTo từ client).
      // Thiếu callback này thì forgetPassword() ném lỗi → reset owner chết âm thầm.
      sendResetPassword: async ({ user, url }) => {
        await emailService.sendResetPasswordEmail(
          user.email,
          url,
          user.name ?? 'bạn',
        );
      },
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
    // Sign in with Google (owner/admin). Callback URL registered in Google
    // Cloud: {BETTER_AUTH_URL}/api/auth/owner/callback/google.
    ...(googleEnabled
      ? {
          socialProviders: {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID as string,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            },
          },
        }
      : {}),
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
