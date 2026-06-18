import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlobalLayoutSchema,
  PageLayoutSchema,
  ThemeTemplateSchema,
} from '@ecommerce/database';
import { ThemeMarketController } from './theme-market.controller';
import { ThemeMarketService } from './theme-market.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ThemeTemplate', schema: ThemeTemplateSchema.clone() },
      { name: 'GlobalLayout', schema: GlobalLayoutSchema.clone() },
      { name: 'PageLayout', schema: PageLayoutSchema.clone() },
    ]),
  ],
  controllers: [ThemeMarketController],
  providers: [ThemeMarketService],
  exports: [ThemeMarketService],
})
export class ThemeMarketModule {}
