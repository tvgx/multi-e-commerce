import { Controller, Get, Put, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { CustomException } from '../../common/exceptions/custom.exception';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getProfile(): Promise<BaseResponseDto<any>> {
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      name: 'Dev User',
    };
    return BaseResponseDto.success(mockUser);
  }

  @Put('change-username')
  async changeUsername(
    @Body('newName') newName: string,
  ): Promise<BaseResponseDto<any>> {
    const userId = 'dev-user-123';
    return this.authService.changeUsername(userId, newName);
  }
}
