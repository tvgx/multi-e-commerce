import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import type { OwnerAuth } from './owner-auth.config';
import type { CustomerAuth } from './customer-auth.config';
import { OWNER_AUTH, CUSTOMER_AUTH } from './auth.constants';

@Injectable()
export class AuthService {
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
}
