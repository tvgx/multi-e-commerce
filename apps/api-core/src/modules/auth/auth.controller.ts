import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/better-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { ResponseCodes } from '../../common/constants/response-codes.constant';
import { CustomException } from '../../common/exceptions/custom.exception';
import { UpdateUserProfileDto } from './dto/auth-update.dto';

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

  /**
   * PUT /api/auth/profile
   * Cập nhật thông tin cá nhân của Owner.
   * Yêu cầu header: 'x-auth-type: owner'
   */
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
}
