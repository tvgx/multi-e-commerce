import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CatalogController } from './catalog.controller';
import { StorefrontCatalogController } from './storefront-catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogStreamService } from './catalog-stream.service';
import { OptionTypeController } from './option-type.controller';
import { OptionTypeService } from './option-type.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PlatformCatalogController } from './platform-catalog.controller';
import { PlatformCatalogService } from './platform-catalog.service';
import { ProductImportService } from './product-import.service';
import { ProductImportProcessor } from './product-import.processor';

@Module({
  imports: [
    // TODO 9: import sản phẩm hàng loạt chạy nền (tạo SP + tải ảnh về MinIO).
    BullModule.registerQueue({ name: 'product-import' }),
  ],
  controllers: [CatalogController, StorefrontCatalogController, OptionTypeController, CategoryController, PlatformCatalogController],
  providers: [CatalogService, CatalogStreamService, OptionTypeService, CategoryService, PlatformCatalogService, ProductImportService, ProductImportProcessor]
})
export class CatalogModule {}
