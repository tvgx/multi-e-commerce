import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GlobalLayoutSchema, PageLayoutSchema, UIComponentCatalogSchema } from '@ecommerce/database';
import * as path from 'path';

import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { LayoutService } from './modules/layout/layout.service';

/**
 * Module tối giản cho worker độc lập /scripts/shop-builder.
 * Bootstrap qua NestFactory.createApplicationContext() để TÁI DÙNG LayoutService
 * (materialize ảnh → MinIO, ghi Mongo, mark PUBLISHED) cùng PrismaService/MinioService/
 * mongoose models.
 *
 * Cố ý KHÔNG import LayoutModule: nó đăng ký LayoutController → BetterAuthGuard →
 * AuthService → better-auth (ESM), không cần thiết cho worker. Ở đây ta đăng ký
 * thẳng các mongoose model + provide LayoutService. KHÔNG HTTP, KHÔNG controller.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.resolve(__dirname, '../../../.env'),
      isGlobal: true,
    }),
    DatabaseModule, // PrismaService (@Global)
    CommonModule, // TenantService + MinioService (@Global)
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_DB_ATLAS') || 'mongodb://localhost:27017/ecommerce',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        autoIndex: false,
      }),
    }),
    MongooseModule.forFeature([
      { name: 'GlobalLayout', schema: GlobalLayoutSchema.clone() },
      { name: 'PageLayout', schema: PageLayoutSchema.clone() },
      { name: 'UIComponentCatalog', schema: UIComponentCatalogSchema.clone() },
    ]),
  ],
  providers: [LayoutService],
})
export class WorkerAppModule {}
