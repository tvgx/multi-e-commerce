import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubscribeDto } from './dto/customer.dto';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto): Promise<BaseResponseDto<any>> {
    try {
      // Check if already subscribed to THIS shop
      const existing = await this.prisma.customer.findUnique({
        where: {
          shopId_email: {
            shopId: dto.shopId,
            email: dto.email,
          },
        },
      });

      if (existing) {
        throw new CustomException(
          ResponseCodes.ACTION_DONE_PREVIOUSLY,
          'action has been done previously by this user.',
          HttpStatus.CONFLICT,
        );
      }

      const customer = await this.prisma.customer.create({
        data: {
          shopId: dto.shopId,
          email: dto.email,
          name: dto.name,
        },
      });

      return BaseResponseDto.success(customer);
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
