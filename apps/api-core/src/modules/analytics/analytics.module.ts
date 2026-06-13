import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsTrackingController } from './analytics-tracking.controller';
import { AnalyticsService } from './analytics.service';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [AnalyticsController, AnalyticsTrackingController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
