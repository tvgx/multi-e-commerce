import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThemeMarketService } from './theme-market.service';
import type { AuthActor } from './theme-market.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { BaseResponseDto } from '../../common/dto/base-response.dto';

/**
 * Theme Market + Theme Shop endpoints.
 *
 * Browse (`GET /`, `GET /:id`) is public. Everything else requires an
 * authenticated owner; ownership and ADMIN checks live in the service (role is
 * resolved from the DB, since it isn't carried in the better-auth session).
 * Route order matters: the literal `mine` / `admin/*` GETs are declared before
 * the `:themeId` catch-all.
 */
@Controller('themes')
@UseGuards(BetterAuthGuard)
export class ThemeMarketController {
  constructor(private readonly themeMarket: ThemeMarketService) {}

  // ---- browse (public) --------------------------------------------------

  @Public()
  @Get()
  async listThemes(@Query('status') status?: 'draft' | 'pending' | 'published' | 'all') {
    const data = await this.themeMarket.listThemes(status ?? 'published');
    return BaseResponseDto.success(data);
  }

  // ---- authoring: seller-owned ------------------------------------------

  @Get('mine')
  async listMine(@CurrentUser() user: AuthActor) {
    const data = await this.themeMarket.listMine(user.id);
    return BaseResponseDto.success(data);
  }

  @Get('admin/review')
  async listForReview(
    @CurrentUser() user: AuthActor,
    @Query('status') status?: 'draft' | 'pending' | 'published',
  ) {
    const data = await this.themeMarket.listForReview(user, status ?? 'pending');
    return BaseResponseDto.success(data);
  }

  @Public()
  @Get(':themeId')
  async getTheme(@Param('themeId') themeId: string) {
    const data = await this.themeMarket.getTheme(themeId);
    return BaseResponseDto.success(data);
  }

  // Capture the shop's current draft design as a new (draft) theme.
  @Post('from-shop/:shopId')
  async createFromShop(
    @Param('shopId') shopId: string,
    @CurrentUser() user: AuthActor,
    @Body() body: { title?: string; description?: string; category?: string },
  ) {
    const data = await this.themeMarket.createFromShop(shopId, user, body ?? {});
    return BaseResponseDto.success(data);
  }

  // Import a Figma file into a draft theme (proxied to design-agent).
  @Post('import-figma/:shopId')
  async importFromFigma(
    @Param('shopId') shopId: string,
    @CurrentUser() user: AuthActor,
    @Body()
    body: {
      fileKey?: string;
      title?: string;
      description?: string;
      category?: string;
      nodeIds?: string[];
    },
  ) {
    const data = await this.themeMarket.importFromFigma(shopId, user, body ?? {});
    return BaseResponseDto.success(data);
  }

  // Apply a theme to a shop's DRAFT layout; UI then redirects to builder.
  @Post(':themeId/apply/:shopId')
  async applyTheme(
    @Param('themeId') themeId: string,
    @Param('shopId') shopId: string,
    @CurrentUser() user: AuthActor,
  ) {
    const data = await this.themeMarket.applyTheme(themeId, shopId, user);
    return BaseResponseDto.success(data);
  }

  @Patch(':themeId/submit')
  async submit(
    @Param('themeId') themeId: string,
    @CurrentUser() user: AuthActor,
  ) {
    const data = await this.themeMarket.submitForReview(themeId, user);
    return BaseResponseDto.success(data);
  }

  // ---- admin curation ---------------------------------------------------

  @Patch(':themeId/publish')
  async publishTheme(
    @Param('themeId') themeId: string,
    @CurrentUser() user: AuthActor,
  ) {
    const data = await this.themeMarket.publishTheme(themeId, user);
    return BaseResponseDto.success(data);
  }

  @Patch(':themeId/reject')
  async rejectTheme(
    @Param('themeId') themeId: string,
    @CurrentUser() user: AuthActor,
    @Body() body: { reason?: string },
  ) {
    const data = await this.themeMarket.rejectTheme(themeId, body?.reason ?? '', user);
    return BaseResponseDto.success(data);
  }

  @Delete(':themeId')
  async deleteTheme(
    @Param('themeId') themeId: string,
    @CurrentUser() user: AuthActor,
  ) {
    const data = await this.themeMarket.deleteTheme(themeId, user);
    return BaseResponseDto.success(data);
  }
}
