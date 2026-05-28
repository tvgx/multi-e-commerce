import { Module } from '@nestjs/common';
import { OptionTypeController } from './option-type.controller';
import { OptionTypeService } from './option-type.service';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [OptionTypeController],
  providers: [OptionTypeService],
  exports: [OptionTypeService],
})
export class OptionTypeModule {}
