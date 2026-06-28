import { Injectable, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import type { OwnerAuth } from './owner-auth.config';
import type { CustomerAuth } from './customer-auth.config';
import { OWNER_AUTH, CUSTOMER_AUTH } from './auth.constants';
import { UpdateUserProfileDto } from './dto/auth-update.dto';
import type { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OWNER_AUTH) private readonly ownerAuth: OwnerAuth,
    @Inject(CUSTOMER_AUTH) private readonly customerAuth: CustomerAuth,
  ) {}

  /**
   * Xác thực session của Owner/Admin.
   * Sử dụng Better Auth's api.getSession để parse token từ cookie/header.
   */
  async getOwnerSession(request: Request): Promise<{
    user: Record<string, unknown>;
    session: Record<string, unknown>;
  } | null> {
    try {
      const session = await this.ownerAuth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      return session as any;
    } catch {
      return null;
    }
  }

  /**
   * Xác thực session của Customer (Storefront).
   * Sử dụng Better Auth's api.getSession với customerAuth instance riêng biệt.
   */
  async getCustomerSession(request: Request): Promise<{
    user: Record<string, unknown>;
    session: Record<string, unknown>;
  } | null> {
    try {
      const session = await this.customerAuth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      return session as any;
    } catch {
      return null;
    }
  }

  /**
   * Thay đổi tên hiển thị của Owner.
   */
  async changeUsername(
    userId: string,
    newName: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new CustomException(
          ResponseCodes.TOKEN_INVALID,
          'invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const currentName = user.name || (user as any).fullName;

      if (currentName === newName) {
        throw new CustomException(
          ResponseCodes.CHANGE_USERNAME_SAME_OTHER,
          'Change Username: same other name',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { name: newName } as any,
      });

      return BaseResponseDto.success({ updated: true });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Exception error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new CustomException(
          ResponseCodes.TOKEN_INVALID,
          'invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName,
          identityNumber: dto.identityNumber,
          gender: dto.gender,
          ...(dto.dateOfBirth !== undefined
            ? {
                dateOfBirth: dto.dateOfBirth
                  ? new Date(dto.dateOfBirth)
                  : null,
              }
            : {}),
        },
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'Failed to update profile.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Auth Endpoints implementations via Better Auth API --- //

  /**
   * Register — proxy qua Better Auth signUpEmail.
   * Tạo user + session, trả về token + user data trong response body.
   *
   * @deprecated AUTH-2: endpoint này KHÔNG set Set-Cookie (better-auth được gọi
   * không kèm `asResponse`), nên không tạo được session cookie cho trình duyệt.
   * Admin dùng better-auth client trực tiếp; customer dùng `/api/storefront-auth/register`.
   * Giữ lại để tương thích nhưng đừng nối UI mới vào đây — sẽ "thành công giả".
   */
  async register(dto: RegisterDto): Promise<BaseResponseDto<any>> {
    this.logger.warn(
      'DEPRECATED POST /api/auth/register called — returns a body token but no session cookie (AUTH-2). Use the better-auth client or /api/storefront-auth/register.',
    );
    try {
      const result = await this.ownerAuth.api.signUpEmail({
        body: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });

      if (!result) {
        throw new CustomException(
          ResponseCodes.EXCEPTION_ERROR,
          'Registration failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = result as any;

      this.logger.log(`Owner registered: ${dto.email}`);

      return BaseResponseDto.success({
        token: data.token || data.session?.token || null,
        user: data.user
          ? { id: data.user.id, email: data.user.email, name: data.user.name }
          : null,
        session: data.session
          ? { id: data.session.id, expiresAt: data.session.expiresAt }
          : null,
      });
    } catch (error: unknown) {
      if (error instanceof CustomException) throw error;
      const message = error instanceof Error ? error.message : 'Registration failed';
      this.logger.error(`Register failed for ${dto.email}: ${message}`);
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Login — proxy qua Better Auth signInEmail.
   * Xác thực credentials, tạo session, trả về token + user data.
   *
   * @deprecated AUTH-2: như {@link register}, không set Set-Cookie nên không
   * thiết lập được session cookie. Admin dùng better-auth client trực tiếp;
   * customer dùng `/api/storefront-auth/login`.
   */
  async login(dto: LoginDto): Promise<BaseResponseDto<any>> {
    this.logger.warn(
      'DEPRECATED POST /api/auth/login called — returns a body token but no session cookie (AUTH-2). Use the better-auth client or /api/storefront-auth/login.',
    );
    try {
      const result = await this.ownerAuth.api.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
        },
      });

      if (!result) {
        throw new CustomException(
          ResponseCodes.PASSWORD_NOT_CORRECT,
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const data = result as any;

      this.logger.log(`Owner logged in: ${dto.email}`);

      return BaseResponseDto.success({
        token: data.token || data.session?.token || null,
        user: data.user
          ? { id: data.user.id, email: data.user.email, name: data.user.name }
          : null,
        session: data.session
          ? { id: data.session.id, expiresAt: data.session.expiresAt }
          : null,
      });
    } catch (error: unknown) {
      if (error instanceof CustomException) throw error;
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      this.logger.warn(`Login failed for ${dto.email}: ${message}`);
      throw new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async forgotPassword(dto: { email: string }): Promise<BaseResponseDto<any>> {
    try {
      await (this.ownerAuth.api as any).forgetPassword({
        body: { email: dto.email, redirectTo: '/reset-password' },
      });
    } catch (error: unknown) {
      // Vẫn trả message trung tính để không leak email có tồn tại hay không,
      // nhưng PHẢI log: trước đây `catch {}` nuốt lỗi khiến reset owner chết âm
      // thầm khi sendResetPassword chưa cấu hình.
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`forgotPassword failed for ${dto.email}: ${message}`);
    }
    return BaseResponseDto.success({
      message: 'If the email exists, a reset link will be sent.',
    });
  }

  async resetPassword(dto: { token: string; newPassword: string }): Promise<BaseResponseDto<any>> {
    try {
      await this.ownerAuth.api.resetPassword({
        body: { token: dto.token, newPassword: dto.newPassword },
      });
      return BaseResponseDto.success({ message: 'Password reset successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    request: Request,
  ): Promise<BaseResponseDto<any>> {
    try {
      // AUTH-1: truyền session headers để better-auth xác định đúng owner đang
      // đăng nhập và xác minh currentPassword với tài khoản đó.
      await this.ownerAuth.api.changePassword({
        body: {
          currentPassword: dto.oldPassword,
          newPassword: dto.newPassword,
        },
        headers: fromNodeHeaders(request.headers),
      });
      this.logger.log(`Password changed for user: ${userId}`);
      return BaseResponseDto.success({ message: 'Password changed successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async logout(userId: string): Promise<BaseResponseDto<any>> {
    try {
      // Revoke all sessions cho user này
      await this.ownerAuth.api.revokeSessions({
        body: { userId },
      } as any);
      this.logger.log(`Owner logged out: ${userId}`);
      return BaseResponseDto.success({ message: 'Logged out successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      this.logger.error(`Logout failed for ${userId}: ${message}`);
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
