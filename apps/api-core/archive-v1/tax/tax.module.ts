import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [TaxService],
  controllers: [TaxController],
  exports: [TaxService],
})
export class TaxModule {}
