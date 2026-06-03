import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { GlobalLayoutSchema, PageLayoutSchema } from '@ecommerce/database';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'GlobalLayout', schema: GlobalLayoutSchema },
      { name: 'PageLayout', schema: PageLayoutSchema },
    ]),
  ],
  controllers: [LayoutController],
  providers: [LayoutService]
})
export class LayoutModule {}

