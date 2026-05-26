import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { ExplorerController } from './explorer.controller';
import { SystemBootstrapController } from './bootstrap.controller';
import { DatabaseModule } from '../database/database.module';
import { LayoutModule } from '../layout/layout.module';
import { NavigationModule } from '../navigation/navigation.module';

@Module({
  imports: [DatabaseModule, LayoutModule, NavigationModule],
  providers: [SystemService],
  controllers: [
    SystemController,
    ExplorerController,
    SystemBootstrapController,
  ],
})
export class SystemModule {}
