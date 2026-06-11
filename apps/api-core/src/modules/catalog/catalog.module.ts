import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { StorefrontCatalogController } from './storefront-catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';
import { OptionTypeController } from './option-type.controller';
import { OptionTypeService } from './option-type.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CatalogController, StorefrontCatalogController, OptionTypeController, CategoryController],
  providers: [CatalogService, CatalogStreamService, OptionTypeService, CategoryService]
})
export class CatalogModule {}

