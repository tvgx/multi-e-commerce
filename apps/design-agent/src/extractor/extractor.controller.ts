import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractorService } from './extractor.service';

interface ExtractThemeBody {
  fileKey?: string;
  nodeIds?: string[];
  tenantId?: string | null;
  ownerUserId?: string | null;
  ownerShopId?: string | null;
  themeId?: string;
  title?: string;
  description?: string;
  category?: string;
  noImages?: boolean;
  publish?: boolean;
}

/**
 * Server-to-server endpoint that runs the Figma→theme pipeline. Called by
 * api-core (`ThemeMarketService.importFromFigma`) so sellers can import a Figma
 * file from the web. NOT for browsers: guarded by a shared `x-internal-key`
 * (env INTERNAL_API_KEY), since owner cookies aren't present on internal calls.
 */
@Controller('design-agent')
export class ExtractorController {
  constructor(
    private readonly extractor: ExtractorService,
    private readonly config: ConfigService,
  ) {}

  @Post('extract-theme')
  async extractTheme(
    @Headers('x-internal-key') internalKey: string,
    @Body() body: ExtractThemeBody,
  ) {
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (!expected || internalKey !== expected) {
      throw new UnauthorizedException('Invalid internal key');
    }
    if (!body?.fileKey) throw new BadRequestException('fileKey is required');
    if (!body?.title) throw new BadRequestException('title is required');

    try {
      return await this.extractor.extractAndPromote({
        fileKey: body.fileKey,
        nodeIds: body.nodeIds,
        tenantId: body.tenantId ?? null,
        ownerUserId: body.ownerUserId ?? null,
        ownerShopId: body.ownerShopId ?? null,
        themeId: body.themeId,
        title: body.title,
        description: body.description,
        category: body.category,
        noImages: body.noImages,
        publish: body.publish,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // A bad/unreachable Figma file is the most likely seller error — surface
      // it as a clean 400 instead of an opaque 500.
      if (/failed: 40[0-9]/.test(msg)) {
        throw new BadRequestException(
          `Không truy cập được file Figma "${body.fileKey}". Kiểm tra file key và quyền chia sẻ của token.`,
        );
      }
      throw err;
    }
  }
}
