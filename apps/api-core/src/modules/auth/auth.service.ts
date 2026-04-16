import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomException } from '../../common/exceptions/custom.exception';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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

      // Note: If prisma generate was successful, 'name' should be available.
      // If not, we fall back to 'fullName' which is the old schema field.
      // The IDE currently reports it as 'fullName'.
      const currentName = user.name || user.fullName;

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
