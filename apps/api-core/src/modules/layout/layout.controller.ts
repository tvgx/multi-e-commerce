import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { CreateMasterTemplateDto, UpdateTenantLayoutDto } from './dto/layout.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@Controller('layout')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  // Master Template usually created by System Admins, but for mock sake:
  @Post('master')
  createMasterTemplate(@Body() dto: CreateMasterTemplateDto) {
    return this.layoutService.createMasterTemplate(dto);
  }

  @Public()
  @Get('tenant')
  getTenantLayout() {
    // This is called by storefront (Next.js App Router)
    return this.layoutService.getTenantLayout();
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('tenant')
  updateTenantLayout(@Body() dto: UpdateTenantLayoutDto) {
    return this.layoutService.updateTenantLayout(dto);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('publish')
  publishLayout() {
    return this.layoutService.publishLayout();
  }
}

