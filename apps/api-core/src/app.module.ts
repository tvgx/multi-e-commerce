import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { SystemModule } from './system/system.module';
import { LayoutModule } from './layout/layout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    ShopModule,
    ProductModule,
    SystemModule,
    LayoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
