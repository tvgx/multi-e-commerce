import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { SystemModule } from './system/system.module';
import { LayoutModule } from './layout/layout.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SystemCacheModule } from './system/cache/cache.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { CommonModule } from './common/common.module';
import { CollectionModule } from './collection/collection.module';
import { NavigationModule } from './navigation/navigation.module';
import { PagesModule } from './pages/pages.module';
import { ShippingModule } from './shipping/shipping.module';
import { TaxModule } from './tax/tax.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_DB_ATLAS || 'mongodb://localhost:27017/ecommerce',
      {
        maxPoolSize: 10,
      },
    ),
    DatabaseModule,
    CommonModule,
    AuthModule,
    ShopModule,
    ProductModule,
    CustomerModule,
    OrderModule,
    SystemModule,
    LayoutModule,
    AnalyticsModule,
    SystemCacheModule,
    CartModule,
    PaymentModule,
    CommonModule,
    CollectionModule,
    NavigationModule,
    PagesModule,
    ShippingModule,
    TaxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
