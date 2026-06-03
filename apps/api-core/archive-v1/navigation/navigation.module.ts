import { Module } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { SystemCacheModule } from '../system/cache/cache.module';

@Module({
  imports: [DatabaseModule, CommonModule, SystemCacheModule],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
