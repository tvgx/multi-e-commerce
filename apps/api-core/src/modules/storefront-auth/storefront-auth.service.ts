import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { signJwt, verifyJwt } from './jwt.utils';
import { TenantService } from '../../common/services/tenant.service';

/**
 * StorefrontAuthService
 *
 * Luồng auth chính cho Customer của storefront: email/password với JWT
 * (HS256, xem jwt.utils.ts). Token được StorefrontAuthGuard kiểm tra.
 * Password lưu bcrypt trong CustomerAccount (providerId 'credential').
 *
 * shopId lấy từ tenant context (header x-shop-id) hoặc body.shopId.
 */
@Injectable()
export class StorefrontAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly tenantService: TenantService,
  ) {}

  private resolveShopId(body: any): string {
    const shopId = this.tenantService.getTenantId() || body?.shopId;
    if (!shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Shop context is missing (x-shop-id header or shopId required)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return shopId;
  }

  private issueToken(customer: { id: string; email: string; shopId: string }) {
    return signJwt({ sub: customer.id, email: customer.email, shopId: customer.shopId });
  }

  async register(body: any): Promise<BaseResponseDto<any>> {
    const { email, password } = body;
    const name = body.fullName || body.name;
    const shopId = this.resolveShopId(body);

    if (!email || !password) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new CustomException(
        ResponseCodes.NO_DATA_END_OF_LIST,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if customer already exists for this shop
    const existing = await this.prisma.customer.findUnique({
      where: { shopId_email: { shopId, email } },
    });

    if (existing) {
      throw new CustomException(
        ResponseCodes.USER_EXISTED,
        'Customer already exists in this shop',
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: { email, name, shopId },
      });
      await tx.customerAccount.create({
        data: {
          id: randomUUID(),
          accountId: email,
          providerId: 'credential',
          customerId: created.id,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      });
      return created;
    });

    return BaseResponseDto.success({
      token: this.issueToken(customer),
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  }

  async login(body: any): Promise<BaseResponseDto<any>> {
    const { email, password } = body;
    const shopId = this.resolveShopId(body);

    if (!email || !password) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { shopId_email: { shopId, email } },
    });

    // Thông báo chung để không lộ email nào tồn tại trong shop
    const invalidCredentials = () =>
      new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );

    if (!customer) throw invalidCredentials();

    const account = await this.prisma.customerAccount.findFirst({
      where: { customerId: customer.id, password: { not: null } },
    });
    if (!account?.password) throw invalidCredentials();

    const ok = await bcrypt.compare(password, account.password);
    if (!ok) throw invalidCredentials();

    return BaseResponseDto.success({
      token: this.issueToken(customer),
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  }

  async changePassword(
    _body: any,
    _customerId: string,
  ): Promise<BaseResponseDto<any>> {
    // SFAUTH-1: password management lives in Better Auth (CustomerAccount). This
    // endpoint can't change a password, so FAIL LOUDLY instead of returning a
    // success wrapper — a 200 here was a silent "false success" if any UI wired
    // to it. Callers must use /api/auth/customer/change-password (Better Auth).
    throw new CustomException(
      ResponseCodes.EXCEPTION_ERROR,
      'Password changes are handled by Better Auth — call /api/auth/customer/change-password instead.',
      HttpStatus.BAD_REQUEST,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Sign in with Google (buyer / storefront)
  //
  // Buyers are multi-tenant (unique per shopId+email) and use the custom JWT,
  // not better-auth. We therefore run our own OAuth flow and carry the shop
  // through Google via a short-lived signed `state`. One backend callback URI
  // serves every shop. Implemented with fetch — no extra dependency.
  // ─────────────────────────────────────────────────────────────

  private readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

  private googleRedirectUri(): string {
    const base =
      process.env.BETTER_AUTH_URL || process.env.API_CORE_URL || 'http://localhost:3000';
    return `${base}/api/storefront-auth/google/callback`;
  }

  /** Build the Google consent URL for a shop's storefront login. */
  async getGoogleAuthUrl(shopSlug: string, redirect?: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Google login is not configured',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    if (!shopSlug) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'shopSlug is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const shop = await this.prisma.shop.findFirst({
      where: { OR: [{ id: shopSlug }, { domain: shopSlug }] },
      select: { id: true },
    });
    if (!shop) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Shop not found', HttpStatus.NOT_FOUND);
    }

    // ~10 min signed state carrying the shop so the callback stays shop-scoped.
    const state = signJwt(
      { shopId: shop.id, shopSlug, redirect: redirect || '', purpose: 'sf-google' },
      10 / (24 * 60),
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleRedirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /** Exchange the Google code, upsert the (shop-scoped) customer, issue a JWT. */
  async handleGoogleCallback(
    code: string,
    state: string,
  ): Promise<{ token: string; shopSlug: string; redirect: string }> {
    if (!code || !state) {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Missing code or state', HttpStatus.BAD_REQUEST);
    }

    let decoded: any;
    try {
      decoded = verifyJwt(state);
    } catch {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Invalid or expired state', HttpStatus.BAD_REQUEST);
    }
    if (decoded.purpose !== 'sf-google' || !decoded.shopId || !decoded.shopSlug) {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Invalid state', HttpStatus.BAD_REQUEST);
    }
    const { shopId, shopSlug, redirect } = decoded;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Google login is not configured', HttpStatus.NOT_IMPLEMENTED);
    }

    const tokenRes = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.googleRedirectUri(),
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenRes.ok) {
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Google token exchange failed', HttpStatus.UNAUTHORIZED);
    }
    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'No access token from Google', HttpStatus.UNAUTHORIZED);
    }

    const infoRes = await fetch(this.GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) {
      throw new CustomException(ResponseCodes.EXCEPTION_ERROR, 'Failed to load Google profile', HttpStatus.UNAUTHORIZED);
    }
    const info: any = await infoRes.json();
    const email: string | undefined = info.email;
    if (!email) {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Google account has no email', HttpStatus.BAD_REQUEST);
    }
    const name = info.name || email;
    const now = new Date();

    // Upsert the shop-scoped customer + a 'google' account link.
    const customer = await this.prisma.$transaction(async (tx) => {
      let c = await tx.customer.findUnique({ where: { shopId_email: { shopId, email } } });
      if (!c) {
        c = await tx.customer.create({
          data: { email, name, shopId, emailVerified: !!info.email_verified },
        });
      }
      const acct = await tx.customerAccount.findFirst({
        where: { customerId: c.id, providerId: 'google' },
      });
      if (!acct) {
        await tx.customerAccount.create({
          data: {
            id: randomUUID(),
            accountId: info.sub || email,
            providerId: 'google',
            customerId: c.id,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
      return c;
    });

    return {
      token: this.issueToken({ id: customer.id, email: customer.email, shopId: customer.shopId }),
      shopSlug,
      redirect: redirect || '',
    };
  }

  async getMe(customerId: string): Promise<BaseResponseDto<any>> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, name: true, shopId: true, createdAt: true }
    });
    if (!customer) throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Customer not found', HttpStatus.NOT_FOUND);
    return BaseResponseDto.success(customer);
  }

  async forgotPassword(email: string, shopId: string, shopSlug: string): Promise<BaseResponseDto<any>> {
    const customer = await this.prisma.customer.findUnique({
      where: { shopId_email: { shopId, email } }
    });

    if (!customer) {
      // Don't leak if customer exists or not
      return BaseResponseDto.success({ message: 'If the email exists, a reset link will be sent.' });
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // customerVerification logic
    // SEC-1: bind the reset to its shop. Customer is unique per (shopId, email),
    // so storing the bare email here would let resetPassword resolve a same-email
    // customer in a DIFFERENT shop. Encode shopId so the reset stays shop-scoped.
    await this.prisma.customerVerification.create({
      data: {
        id: randomUUID(),
        identifier: `${shopId}:${email}`,
        value: token,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const STOREFRONT_BASE = process.env.STOREFRONT_URL || 'http://localhost:3002';
    const resetUrl = `${STOREFRONT_BASE}/${shopSlug}/account/reset-password?token=${token}`;
    
    await this.emailService.sendResetPasswordEmail(email, resetUrl, customer.name || 'Khách hàng');

    return BaseResponseDto.success({ message: 'If the email exists, a reset link will be sent.' });
  }

  async resetPassword(token: string, newPassword: string): Promise<BaseResponseDto<any>> {
    const verification = await this.prisma.customerVerification.findFirst({
      where: { value: token, expiresAt: { gt: new Date() } }
    });

    if (!verification) {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Invalid or expired token', HttpStatus.BAD_REQUEST);
    }

    // SEC-1: identifier is stored as `${shopId}:${email}`. Resolve via the
    // composite unique key so the reset can only ever touch the customer in the
    // shop the token was issued for — findFirst by email alone could hit a
    // same-email customer in another shop (split on the first ':' since shopId
    // never contains one).
    const sepIndex = verification.identifier.indexOf(':');
    if (sepIndex === -1) {
      throw new CustomException(ResponseCodes.PARAM_VALUE_INVALID, 'Invalid or expired token', HttpStatus.BAD_REQUEST);
    }
    const shopId = verification.identifier.slice(0, sepIndex);
    const email = verification.identifier.slice(sepIndex + 1);

    const customer = await this.prisma.customer.findUnique({
      where: { shopId_email: { shopId, email } }
    });

    if (!customer) {
      throw new CustomException(ResponseCodes.NO_DATA_END_OF_LIST, 'Customer not found', HttpStatus.NOT_FOUND);
    }

    // Hash new password using bcrypt (same as better-auth)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const account = await this.prisma.customerAccount.findFirst({
      where: { customerId: customer.id }
    });

    if (account) {
      await this.prisma.customerAccount.update({
        where: { id: account.id },
        data: { password: passwordHash }
      });
    }

    // delete token so it can't be reused
    await this.prisma.customerVerification.delete({
      where: { id: verification.id }
    });

    return BaseResponseDto.success({ message: 'Password has been reset successfully' });
  }
}
