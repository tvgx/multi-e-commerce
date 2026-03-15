import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('master-summary')
  async getMasterSummary() {
    return this.analyticsService.getMasterSummary();
  }

  @Get('master-charts')
  async getMasterCharts() {
    return this.analyticsService.getMasterCharts();
  }

  @Get('shop/:shopId/summary')
  async getShopSummary(@Param('shopId') shopId: string) {
    return this.analyticsService.getShopSummary(shopId);
  }

  @Get('shop/:shopId/charts')
  async getShopCharts(@Param('shopId') shopId: string) {
    return this.analyticsService.getShopCharts(shopId);
  }
}
