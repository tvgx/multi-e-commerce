import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { SystemModule } from './system/system.module';
import { LayoutModule } from './layout/layout.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SystemCacheModule } from './system/cache/cache.module';

import { auth } from './auth';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    BetterAuthModule.forRoot({
      auth,
    }),
    DatabaseModule,
    AuthModule,
    ShopModule,
    ProductModule,
    CustomerModule,
    OrderModule,
    SystemModule,
    LayoutModule,
    AnalyticsModule,
    SystemCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
