import { Module } from '@nestjs/common';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { LayoutGateway } from './layout.gateway';

@Module({
    controllers: [LayoutController],
    providers: [LayoutService, LayoutGateway],
    exports: [LayoutService],
})
export class LayoutModule { }
