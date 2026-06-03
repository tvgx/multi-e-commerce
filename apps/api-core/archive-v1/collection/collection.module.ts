import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { SystemCacheModule } from '../system/cache/cache.module';

@Module({
  imports: [DatabaseModule, CommonModule, SystemCacheModule],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}

