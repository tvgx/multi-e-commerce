import { Injectable, Logger } from '@nestjs/common';
import {
  convertExtractionsToTheme,
  firstImageUrl,
  slugify,
  FigmaPageExtractionSchema,
  ShopPageLayout,
} from '@ecommerce/schema';
import { FigmaClient } from './figma-client.service';
import { ClaudeExtractorService } from './claude-extractor.service';
import { ComponentMapperService } from './component-mapper.service';
import { ComponentPropReader } from './component-prop.reader';
import { AssetPipelineService } from './asset-pipeline.service';
import { MongoRepository } from './mongo.repository';
import { ThemeRepository } from './theme.repository';
import { getTopLevelFrames, reduceNode } from './node-tree-reducer';
import { IndexBuilderService } from '../rag/index-builder.service';

export interface ExtractFramesOptions {
  fileKey: string;
  tenant?: string | null;
  noImages?: boolean;
  /** Restrict to specific top-level frame ids (default: all frames). */
  nodeIds?: string[];
  /** Persist each frame to the `page_layouts` collection (default true). */
  persist?: boolean;
  onProgress?: (msg: string) => void;
}

export interface ExtractFramesResult {
  /** Validated extraction wrappers (one per successful frame). */
  extractions: Array<{
    figma_node_id: string;
    figma_file_key: string;
    page: ShopPageLayout;
  }>;
  pages: ShopPageLayout[];
  total: number;
  ok: number;
  fileVersion: string;
}

export interface ExtractThemeInput {
  fileKey: string;
  nodeIds?: string[];
  tenantId?: string | null;
  ownerUserId?: string | null;
  ownerShopId?: string | null;
  themeId?: string;
  title: string;
  description?: string;
  category?: string;
  noImages?: boolean;
  /** Publish straight to the market (default: draft / pending review). */
  publish?: boolean;
}

export interface ExtractThemeResult {
  themeId: string;
  status: 'draft' | 'published';
  pages: string[];
  framesExtracted: number;
}

/**
 * Shared Figma → storefront-layout pipeline, reusable from both the CLI
 * (`ExtractCommand`) and HTTP (`ExtractorController`). Keeps the orchestration
 * (fetch file → reduce frames → Claude → map → persist) in one place so the
 * two entry points can't drift.
 */
@Injectable()
export class ExtractorService {
  private readonly logger = new Logger(ExtractorService.name);

  constructor(
    private readonly figma: FigmaClient,
    private readonly extractor: ClaudeExtractorService,
    private readonly mapper: ComponentMapperService,
    private readonly propReader: ComponentPropReader,
    private readonly assets: AssetPipelineService,
    private readonly repo: MongoRepository,
    private readonly themes: ThemeRepository,
    private readonly indexBuilder: IndexBuilderService,
  ) {}

  /** Run the per-frame extraction loop. Upserts `page_layouts` unless persist=false. */
  async extractFrames(opts: ExtractFramesOptions): Promise<ExtractFramesResult> {
    const persist = opts.persist ?? true;
    const log = opts.onProgress ?? ((m: string) => this.logger.log(m));

    log(`Fetching Figma file ${opts.fileKey}…`);
    const file = await this.figma.getFile(opts.fileKey);
    let frames = getTopLevelFrames(file.document);
    if (opts.nodeIds?.length) {
      const wanted = new Set(opts.nodeIds);
      frames = frames.filter((f) => wanted.has(f.id));
    }
    log(`Found ${frames.length} top-level frame(s).`);

    const validComponentIds = this.mapper.getValidComponentIds();
    const propSchema = this.propReader.describeAll(validComponentIds);
    const images = opts.noImages
      ? {}
      : await this.figma.getImages(
          opts.fileKey,
          frames.map((f) => f.id),
        );

    const extractions: ExtractFramesResult['extractions'] = [];
    const pages: ShopPageLayout[] = [];
    for (const frame of frames) {
      try {
        const reduced = reduceNode(frame);
        const assetUrls = await this.assets.resolveAssets(opts.fileKey, reduced);
        const page = await this.extractor.extractPage(reduced, {
          validComponentIds,
          imageUrl: images[frame.id],
          propSchema,
          assetUrls,
        });
        const mappedPage = this.mapper.mapPage(page);

        const extraction = FigmaPageExtractionSchema.parse({
          figma_node_id: frame.id,
          figma_file_key: opts.fileKey,
          figma_version: file.version,
          name: frame.name,
          tenant_id: opts.tenant ?? null,
          extracted_at: new Date().toISOString(),
          page: mappedPage,
        });

        if (persist) {
          await this.repo.upsertPage(extraction);
          log(`Upserted page_layouts/${frame.id} ("${frame.name}").`);
        }
        extractions.push({
          figma_node_id: extraction.figma_node_id,
          figma_file_key: extraction.figma_file_key,
          page: extraction.page as ShopPageLayout,
        });
        pages.push(extraction.page as ShopPageLayout);
      } catch (err) {
        this.logger.error(
          `Frame "${frame.name}" (${frame.id}) failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return {
      extractions,
      pages,
      total: frames.length,
      ok: extractions.length,
      fileVersion: file.version,
    };
  }

  /** Best-effort RAG index refresh — never throws (missing VOYAGE_API_KEY is fine). */
  async refreshIndex(tenant?: string): Promise<void> {
    try {
      this.logger.log('Refreshing RAG index…');
      const res = await this.indexBuilder.buildIndex(tenant);
      this.logger.log(
        `Index: ${res.embedded} embedded, ${res.skipped} unchanged, ${res.pruned} pruned.`,
      );
    } catch (err) {
      this.logger.warn(
        `Skipped RAG index refresh: ${
          err instanceof Error ? err.message : String(err)
        }. Run \`build-index\` manually once VOYAGE_API_KEY is set.`,
      );
    }
  }

  /**
   * Full Figma-import-to-theme flow: extract frames, convert to the editor draft
   * shape, and upsert a `theme_templates` document (draft by default so it goes
   * through admin review). Stamps owner so the importing seller owns the theme.
   */
  async extractAndPromote(input: ExtractThemeInput): Promise<ExtractThemeResult> {
    const result = await this.extractFrames({
      fileKey: input.fileKey,
      tenant: input.tenantId ?? null,
      noImages: input.noImages,
      nodeIds: input.nodeIds,
      persist: true,
    });
    if (result.ok === 0) {
      throw new Error('No frames could be extracted from the Figma file.');
    }

    const { global, pages: outPages } = convertExtractionsToTheme(result.pages);
    const previewImageUrl = firstImageUrl(result.pages);
    const themeId =
      input.themeId ?? `${slugify(input.title)}-${shortId()}`;
    const status: 'draft' | 'published' = input.publish ? 'published' : 'draft';

    await this.themes.upsert({
      themeId,
      title: input.title,
      description: input.description,
      category: input.category,
      status,
      previewImageUrl,
      thumbnails: previewImageUrl ? [previewImageUrl] : [],
      source: {
        figmaFileKey: input.fileKey,
        figmaNodeIds: result.extractions.map((e) => e.figma_node_id),
      },
      global,
      pages: outPages,
      tenantId: input.tenantId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      ownerShopId: input.ownerShopId ?? null,
    });

    return {
      themeId,
      status,
      pages: Object.keys(outPages),
      framesExtracted: result.ok,
    };
  }
}

/** Short collision-resistant suffix for generated theme slugs. */
function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}
