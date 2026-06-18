import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpStatus,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/better-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { CustomException } from '../../common/exceptions/custom.exception';
import { UpdateUserProfileDto } from './dto/auth-update.dto';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';

@Controller('auth')
@UseGuards(BetterAuthGuard) // Áp dụng guard cho toàn bộ controller
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/auth/me
   * Lấy thông tin user hiện tại (Owner hoặc Customer).
   * Requires: Header 'x-auth-type: owner' | 'x-auth-type: customer'
   */
  @Get('me')
  async getProfile(@CurrentUser() user: any): Promise<BaseResponseDto<any>> {
    return BaseResponseDto.success(user);
  }

  /**
   * GET /api/auth/verify-session
   * Kiểm tra session còn hợp lệ không.
   * Trả về { authenticated: true } nếu session hợp lệ.
   */
  @Get('verify-session')
  async verifySession(@CurrentUser() user: any): Promise<BaseResponseDto<any>> {
    return BaseResponseDto.success({
      authenticated: true,
      userId: user?.id,
      email: user?.email,
    });
  }

  /**
   * PUT /api/auth/change-username
   * Thay đổi tên hiển thị (Owner only).
   * Yêu cầu header: 'x-auth-type: owner'
   */
  @Put('change-username')
  async changeUsername(
    @CurrentUser() user: any,
    @Body('newName') newName: string,
  ): Promise<BaseResponseDto<any>> {
    if (!newName?.trim()) {
      throw new CustomException(
        ResponseCodes.EXCEPTION_ERROR,
        'newName is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.changeUsername(user.id, newName);
  }

  /**
   * GET /api/auth/health
   * Public endpoint — không cần xác thực.
   * Dùng cho health checks và smoke tests.
   */
  @Public()
  @Get('health')
  async health(): Promise<BaseResponseDto<any>> {
    return BaseResponseDto.success({ status: 'ok', service: 'auth' });
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserProfileDto,
    @Req() req: any,
  ): Promise<BaseResponseDto<any>> {
    if (req.authType !== 'owner') {
      throw new ForbiddenException('Only owners can update their profiles');
    }
    return this.authService.updateProfile(user.id, dto);
  }

  /**
   * POST /api/auth/register
   * Public — đăng ký owner mới qua Better Auth.
   * Trả về token + user data trong response body.
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * Public — đăng nhập owner qua Better Auth.
   * Trả về token + user + session data trong response body.
   */
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: { email: string }) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: { token: string; newPassword: string }) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ) {
    // AUTH-1: better-auth.changePassword cần session headers để biết đổi mật
    // khẩu cho user nào + xác minh currentPassword. Trước đây không truyền headers
    // nên luôn báo lỗi. Forward req để service dựng lại headers từ cookie.
    return this.authService.changePassword(user.id, dto, req);
  }

  @Post('logout')
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }
}
