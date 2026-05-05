import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { hashPassword, verifyPassword, signJwt } from './jwt.utils';

@Injectable()
export class StorefrontAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: any): Promise<BaseResponseDto<any>> {
    const { email, password, shopId, name } = body;

    if (!email || !password || !shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Email, password, and shopId are required',
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
      where: {
        shopId_email: { shopId, email },
      },
    });

    if (existing) {
      throw new CustomException(
        ResponseCodes.USER_EXISTED,
        'Customer already exists in this shop',
        HttpStatus.CONFLICT,
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        shopId,
      },
    });

    // Generate token
    const token = signJwt({ sub: customer.id, email: customer.email, shopId: customer.shopId });

    return BaseResponseDto.success({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  }

  async login(body: any): Promise<BaseResponseDto<any>> {
    const { email, password, shopId } = body;

    if (!email || !password || !shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'Email, password, and shopId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        shopId_email: { shopId, email },
      },
    });

    if (!customer || !customer.password) {
      throw new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isMatch = await verifyPassword(password, customer.password);
    if (!isMatch) {
      throw new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = signJwt({ sub: customer.id, email: customer.email, shopId: customer.shopId });

    return BaseResponseDto.success({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  }

  async changePassword(body: any, customerId: string): Promise<BaseResponseDto<any>> {
    const { oldPassword, newPassword, shopId } = body;

    if (!oldPassword || !newPassword || !shopId) {
      throw new CustomException(
        ResponseCodes.PARAM_VALUE_INVALID,
        'oldPassword, newPassword, and shopId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.shopId !== shopId || !customer.password) {
      throw new CustomException(
        ResponseCodes.USER_INFO_NOT_MATCH,
        'Customer not found or invalid shop',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isMatch = await verifyPassword(oldPassword, customer.password);
    if (!isMatch) {
      throw new CustomException(
        ResponseCodes.PASSWORD_NOT_CORRECT,
        'Old password incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { password: hashedPassword },
    });

    return BaseResponseDto.success({ updated: true });
  }
}
