import { Module } from '@nestjs/common';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { LayoutGateway } from './layout.gateway';
import { MinioService } from '../storage/minio.service';

@Module({
  controllers: [LayoutController],
  providers: [LayoutService, LayoutGateway, MinioService],
  exports: [LayoutService],
})
export class LayoutModule {}
