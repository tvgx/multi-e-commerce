import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { LayoutModule } from '../layout/layout.module';
import { SystemCacheModule } from '../system/cache/cache.module';

@Module({
  imports: [DatabaseModule, CommonModule, LayoutModule, SystemCacheModule],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
