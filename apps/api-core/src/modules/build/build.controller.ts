import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { BuildService } from './build.service';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

// Chia sẻ prefix 'shops' với ShopController nhưng path con (build / build-status)
// không đụng catch-all GET :shopId.
@Controller('shops')
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  // Enqueue build/publish shop nền (gọi từ trang Billing & Shipping "Lưu và Hoàn tất").
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post(':shopId/build')
  async startBuild(@Param('shopId') shopId: string) {
    return BaseResponseDto.success(await this.buildService.enqueueBuild(shopId));
  }

  // UI poll mỗi ~2s để vẽ thanh tiến độ + URL storefront khi xong.
  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Get(':shopId/build-status')
  async buildStatus(@Param('shopId') shopId: string) {
    return BaseResponseDto.success(await this.buildService.getLatestStatus(shopId));
  }
}
