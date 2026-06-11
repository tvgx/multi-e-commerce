import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { StorefrontCatalogController } from './storefront-catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';
import { OptionTypeController } from './option-type.controller';
import { OptionTypeService } from './option-type.service';

@Module({
  controllers: [CatalogController, StorefrontCatalogController, OptionTypeController],
  providers: [CatalogService, CatalogStreamService, OptionTypeService]
})
export class CatalogModule {}

