import { Global, Module } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { MinioService } from './services/minio.service';

@Global()
@Module({
  providers: [TenantService, MinioService],
  exports: [TenantService, MinioService],
})
export class CommonModule {}
