import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { redisStore } from 'cache-manager-ioredis-yet';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

// New SaaS Modules
import { AuthModule } from './modules/auth/auth.module';
import { StorefrontAuthModule } from './modules/storefront-auth/storefront-auth.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ShopModule } from './modules/shop/shop.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LayoutModule } from './modules/layout/layout.module';
import { ThemeMarketModule } from './modules/theme-market/theme-market.module';
import { MediaModule } from './modules/media/media.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { EmailModule } from './modules/email/email.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CartModule } from './modules/cart/cart.module';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { GeoModule } from './modules/geo/geo.module';
import { BuildModule } from './modules/build/build.module';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    ConfigModule.forRoot({
      envFilePath: path.resolve(__dirname, '../../../.env'),
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get('REDIS_HOST') || 'localhost',
          port: config.get('REDIS_PORT') ? parseInt(config.get('REDIS_PORT') as string) : 6379,
          ttl: 60 * 1000, // 60s default TTL
        }),
      }),
    }),
    // Bull queues (email, payment-timeout, shop-build). forRoot là source-of-truth cho kết nối Redis
    // — phải khớp với worker độc lập /scripts/shop-builder (cùng host/port + prefix 'bull').
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST') || 'localhost',
          port: config.get('REDIS_PORT') ? parseInt(config.get('REDIS_PORT') as string) : 6379,
        },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_DB_ATLAS') ||
          'mongodb://localhost:27017/ecommerce',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        autoIndex: false, // Turn off autoIndex to prevent Kareem crash during index build
      }),
    }),
    AuthModule,
    StorefrontAuthModule,
    ShopModule,
    CatalogModule,
    InventoryModule,
    OrderModule,
    PaymentModule,
    InteractionsModule,
    ChatModule,
    NotificationsModule,
    LayoutModule,
    ThemeMarketModule,
    MediaModule,
    TemplatesModule,
    PromotionsModule,
    AnalyticsModule,
    ShippingModule,
    WalletModule,
    CartModule,
    CustomerAddressModule,
    GeoModule,
    BuildModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: '/*path', method: RequestMethod.ALL });
  }
}
