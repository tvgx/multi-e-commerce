import { Controller, Get, Put, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Session, AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { CustomException } from '../common/exceptions/custom.exception';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getProfile(@Session() session: UserSession): Promise<BaseResponseDto<any>> {
    if (!session) {
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return BaseResponseDto.success(session.user);
  }

  @Put('change-username')
  async changeUsername(
    @Session() session: UserSession,
    @Body('newName') newName: string,
  ): Promise<BaseResponseDto<any>> {
    if (!session) {
      throw new CustomException(
        ResponseCodes.TOKEN_INVALID,
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.authService.changeUsername(session.user.id, newName);
  }
}
