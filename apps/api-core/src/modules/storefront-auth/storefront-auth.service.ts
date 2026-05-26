import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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
}
