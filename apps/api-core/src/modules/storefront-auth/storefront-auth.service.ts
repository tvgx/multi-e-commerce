import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

/**
 * StorefrontAuthService
 *
 * @deprecated Luồng auth chính cho Customer hiện được xử lý bởi Better Auth
 * thông qua endpoint /api/auth/customer/* (customer-auth.config.ts).
 *
 * Service này giữ lại cho compatibility với các endpoint cũ.
 * Password hiện được lưu trong CustomerAccount (thay vì trực tiếp trên Customer).
 */
@Injectable()
export class StorefrontAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async register(body: any): Promise<BaseResponseDto<any>> {
    const { email, shopId, name } = body;

    if (!email || !shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Email and shopId are required. For password auth, use /api/auth/customer/sign-up/email',
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

    const customer = await this.prisma.customer.create({
      data: { email, name, shopId },
    });

    return BaseResponseDto.success({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
      message:
        'Customer created. Use /api/auth/customer/sign-in/email to authenticate.',
    });
  }

  async login(body: any): Promise<BaseResponseDto<any>> {
    const { email, shopId } = body;

    if (!email || !shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Use /api/auth/customer/sign-in/email for authentication',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { shopId_email: { shopId, email } },
    });

    if (!customer) {
      throw new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Customer not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return BaseResponseDto.success({
      message:
        'Use /api/auth/customer/sign-in/email for session-based authentication.',
      customerId: customer.id,
    });
  }

  async changePassword(
    _body: any,
    _customerId: string,
  ): Promise<BaseResponseDto<any>> {
    // Password management is now handled by Better Auth via CustomerAccount
    // Use /api/auth/customer/change-password endpoint
    return BaseResponseDto.success({
      message:
        'Use /api/auth/customer/change-password endpoint (Better Auth) for password changes.',
    });
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
    await this.prisma.customerVerification.create({
      data: {
        id: randomUUID(),
        identifier: email,
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

    const customer = await this.prisma.customer.findFirst({
      where: { email: verification.identifier }
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
