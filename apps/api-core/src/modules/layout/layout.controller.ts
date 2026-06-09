import { Controller, Get, Post, Patch, Body, UseGuards, Param, Query } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { CreateMasterTemplateDto, UpdateTenantLayoutDto, SaveBuilderGlobalDto, SaveBuilderPageDto } from './dto/layout.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

@Controller('layouts')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  // ─── PUBLIC Storefront endpoints ──────────────────────────────────────────

  @Public()
  @Get(':shopId/global')
  async getGlobalLayout(@Param('shopId') shopId: string) {
    const data = await this.layoutService.getGlobalLayout(shopId);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get(':shopId/page/:pageType')
  async getPageLayout(
    @Param('shopId') shopId: string,
    @Param('pageType') pageType: string,
    @Query('slug') slug?: string,
  ) {
    const data = await this.layoutService.getPageLayout(shopId, pageType, slug);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get('builder/schemas')
  async getBuilderSchemas() {
    const data = await this.layoutService.getComponentSchemas();
    return BaseResponseDto.success(data);
  }

  // ─── Builder draft save/load (per-shop, no strict auth for local dev) ─────

  @Public()
  @Get(':shopId/draft/global')
  async getBuilderGlobal(@Param('shopId') shopId: string) {
    const data = await this.layoutService.getBuilderGlobal(shopId);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get(':shopId/draft/page/:pageType')
  async getBuilderPage(
    @Param('shopId') shopId: string,
    @Param('pageType') pageType: string,
  ) {
    const data = await this.layoutService.getBuilderPage(shopId, pageType);
    return BaseResponseDto.success(data);
  }

  @Public()
  @Post('builder/save/global')
  async saveBuilderGlobal(@Body() dto: SaveBuilderGlobalDto) {
    const data = await this.layoutService.saveBuilderGlobal(
      dto.shopId,
      dto.globalComponents || [],
      dto.theme || {},
    );
    return BaseResponseDto.success(data);
  }

  @Public()
  @Post('builder/save/page')
  async saveBuilderPage(@Body() dto: SaveBuilderPageDto) {
    const data = await this.layoutService.saveBuilderPage(
      dto.shopId,
      dto.pageType,
      dto.components || [],
    );
    return BaseResponseDto.success(data);
  }

  @Public()
  @Post(':shopId/publish')
  async publishLayoutByShopId(@Param('shopId') shopId: string) {
    const data = await this.layoutService.publishLayoutByShopId(shopId);
    return BaseResponseDto.success(data);
  }

  // ─── ADMIN endpoints ───────────────────────────────────────────────────────

  // Master Template usually created by System Admins, but for mock sake:
  @Post('master')
  async createMasterTemplate(@Body() dto: CreateMasterTemplateDto) {
    const result = await this.layoutService.createMasterTemplate(dto);
    return BaseResponseDto.success(result);
  }

  @Public()
  @Get('tenant')
  async getTenantLayout() {
    // This is called by storefront (Next.js App Router)
    const result = await this.layoutService.getTenantLayout();
    return BaseResponseDto.success(result);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Patch('tenant')
  async updateTenantLayout(@Body() dto: UpdateTenantLayoutDto) {
    const result = await this.layoutService.updateTenantLayout(dto);
    return BaseResponseDto.success(result);
  }

  @UseGuards(BetterAuthGuard, RolesGuard)
  @RequireRoles('ADMIN', 'OWNER')
  @Post('publish')
  async publishLayout() {
    const result = await this.layoutService.publishLayout();
    return BaseResponseDto.success(result);
  }
}


