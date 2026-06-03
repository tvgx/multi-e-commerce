import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogStreamService]
})
export class CatalogModule {}

