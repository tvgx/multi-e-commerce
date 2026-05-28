import { Module, Global } from '@nestjs/common';
import { MinioService } from './minio.service';
import { StorageController } from './storage.controller';
import { StorageQuotaService } from './storage-quota.service';
import { MediaService } from './media.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [StorageController],
  providers: [MinioService, StorageQuotaService, MediaService],
  exports: [MinioService, StorageQuotaService, MediaService],
})
export class StorageModule {}

