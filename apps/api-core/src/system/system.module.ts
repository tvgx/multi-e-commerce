import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { ExplorerController } from './explorer.controller';
import { DatabaseModule } from '../database/database.module';


@Module({
  imports: [DatabaseModule],
  providers: [SystemService],
  controllers: [SystemController, ExplorerController],

})
export class SystemModule {}
