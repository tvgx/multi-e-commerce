import { Module, Global } from '@nestjs/common';
import { MinioService } from './minio.service';
import { StorageController } from './storage.controller';
import { StorageQuotaService } from './storage-quota.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [StorageController],
  providers: [MinioService, StorageQuotaService],
  exports: [MinioService, StorageQuotaService],
})
export class StorageModule {}
