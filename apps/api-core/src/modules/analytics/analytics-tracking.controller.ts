import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { TrackVisitDto } from './analytics.service';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Beacon public từ storefront — tách khỏi AnalyticsController vì controller
 * đó gắn RolesGuard + RequireRoles ở class level (chỉ dành cho chủ shop).
 * Service tự dedup phiên 30' và validate shopId nên endpoint mở được an toàn.
 */
@UseGuards(BetterAuthGuard)
@Controller('analytics/track')
export class AnalyticsTrackingController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('visit')
  @HttpCode(200)
  trackVisit(@Body() dto: TrackVisitDto) {
    return this.analyticsService.trackVisit(dto);
  }
}
