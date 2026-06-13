import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

// Analytics dành cho chủ shop — mọi endpoint đều scoped theo tenant (x-shop-id)
@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Composite endpoint: trả toàn bộ dữ liệu dashboard trong 1 request
  @Get('dashboard')
  async getDashboard(@Query('period') period?: string) {
    return BaseResponseDto.success(await this.analyticsService.getDashboard(period));
  }

  @Get('summary')
  async getSummary(@Query('period') period?: string) {
    return BaseResponseDto.success(await this.analyticsService.getSummary(period));
  }

  @Get('revenue')
  async getRevenueSeries(@Query('period') period?: string) {
    return BaseResponseDto.success(await this.analyticsService.getRevenueSeries(period));
  }

  @Get('orders-by-status')
  async getOrdersByStatus(@Query('period') period?: string) {
    return BaseResponseDto.success(await this.analyticsService.getOrdersByStatus(period));
  }

  @Get('top-products')
  async getTopProducts(@Query('period') period?: string, @Query('limit') limit?: string) {
    return BaseResponseDto.success(await this.analyticsService.getTopProducts(period, limit));
  }

  @Get('customers')
  async getCustomerInsights(@Query('period') period?: string, @Query('limit') limit?: string) {
    return BaseResponseDto.success(await this.analyticsService.getCustomerInsights(period, limit));
  }

  // ==========================================
  // Platform analytics (Analytics Hub) — không cần x-shop-id.
  // OWNER: tổng hợp trên các shop mình sở hữu; ADMIN: toàn sàn.
  // ==========================================

  /** undefined = toàn sàn (ADMIN); owner chỉ thấy shop của mình */
  private resolveScope(req: any): string[] | undefined {
    if (req.user?.role === 'ADMIN') return undefined;
    return req.shopIds ?? [];
  }

  @Get('platform/dashboard')
  async getPlatformDashboard(@Req() req: any, @Query('period') period?: string) {
    return BaseResponseDto.success(
      await this.analyticsService.getPlatformDashboard(this.resolveScope(req), period),
    );
  }

  @Get('platform/summary')
  async getPlatformSummary(@Req() req: any, @Query('period') period?: string) {
    return BaseResponseDto.success(
      await this.analyticsService.getPlatformSummary(this.resolveScope(req), period),
    );
  }

  @Get('platform/revenue')
  async getPlatformRevenue(@Req() req: any, @Query('period') period?: string) {
    return BaseResponseDto.success(
      await this.analyticsService.getPlatformRevenueSeries(this.resolveScope(req), period),
    );
  }

  @Get('platform/top-shops')
  async getTopShops(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return BaseResponseDto.success(
      await this.analyticsService.getTopShops(this.resolveScope(req), period, limit),
    );
  }
}
