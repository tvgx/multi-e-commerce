import { Module } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
