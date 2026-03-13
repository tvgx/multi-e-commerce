import { Controller, Post, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<BaseResponseDto<any>> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<BaseResponseDto<any>> {
    return this.authService.login(dto);
  }

  // TODO: Implement actual JwtAuthGuard
  @Get('me')
  async getProfile(@Req() req: any): Promise<BaseResponseDto<any>> {
    // Mock user ID extracted from token
    const userId = req.user?.id || 'mock-user-id';
    return this.authService.getProfile(userId);
  }

  // TODO: Implement actual JwtAuthGuard
  @Put('change-username')
  async changeUsername(
    @Req() req: any,
    @Body('newName') newName: string,
  ): Promise<BaseResponseDto<any>> {
    const userId = req.user?.id || 'mock-user-id';
    return this.authService.changeUsername(userId, newName);
  }
}
