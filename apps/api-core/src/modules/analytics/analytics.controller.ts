import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

// Analytics dành cho chủ shop — mọi endpoint đều scoped theo tenant (x-shop-id)
@UseGuards(BetterAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'OWNER')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Composite endpoint: trả toàn bộ dữ liệu dashboard trong 1 request
  @Get('dashboard')
  getDashboard(@Query('period') period?: string) {
    return this.analyticsService.getDashboard(period);
  }

  @Get('summary')
  getSummary(@Query('period') period?: string) {
    return this.analyticsService.getSummary(period);
  }

  @Get('revenue')
  getRevenueSeries(@Query('period') period?: string) {
    return this.analyticsService.getRevenueSeries(period);
  }

  @Get('orders-by-status')
  getOrdersByStatus(@Query('period') period?: string) {
    return this.analyticsService.getOrdersByStatus(period);
  }

  @Get('top-products')
  getTopProducts(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTopProducts(period, limit);
  }

  @Get('customers')
  getCustomerInsights(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getCustomerInsights(period, limit);
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
  getPlatformDashboard(@Req() req: any, @Query('period') period?: string) {
    return this.analyticsService.getPlatformDashboard(this.resolveScope(req), period);
  }

  @Get('platform/summary')
  getPlatformSummary(@Req() req: any, @Query('period') period?: string) {
    return this.analyticsService.getPlatformSummary(this.resolveScope(req), period);
  }

  @Get('platform/revenue')
  getPlatformRevenue(@Req() req: any, @Query('period') period?: string) {
    return this.analyticsService.getPlatformRevenueSeries(this.resolveScope(req), period);
  }

  @Get('platform/top-shops')
  getTopShops(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopShops(this.resolveScope(req), period, limit);
  }
}
