import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { FigmaPageExtractionSchema } from '@ecommerce/schema';
import { FigmaClient } from '../figma-client.service';
import { ClaudeExtractorService } from '../claude-extractor.service';
import { ComponentMapperService } from '../component-mapper.service';
import { MongoRepository } from '../mongo.repository';
import { getTopLevelFrames, reduceNode } from '../node-tree-reducer';
import { IndexBuilderService } from '../../rag/index-builder.service';

interface ExtractOptions {
  fileKey?: string;
  tenant?: string;
  dryRun?: boolean;
  withImages?: boolean;
  skipIndex?: boolean;
}

/**
 * `design-agent extract --file-key=XXX [--tenant=YYY] [--dry-run] [--with-images]`
 *
 * Fetches a Figma file, reduces each top-level frame, has Claude map it to a
 * storefront page layout, reconciles component ids against the registry, and
 * (unless --dry-run) upserts the result into MongoDB.
 */
@Command({
  name: 'extract',
  description: 'Extract page layouts from a Figma file into MongoDB.',
})
export class ExtractCommand extends CommandRunner {
  private readonly logger = new Logger(ExtractCommand.name);

  constructor(
    private readonly figma: FigmaClient,
    private readonly extractor: ClaudeExtractorService,
    private readonly mapper: ComponentMapperService,
    private readonly repo: MongoRepository,
    private readonly indexBuilder: IndexBuilderService,
  ) {
    super();
  }

  async run(_params: string[], options: ExtractOptions): Promise<void> {
    const fileKey = options.fileKey ?? this.figma.defaultFileKey;
    if (!fileKey) {
      throw new Error('No file key: pass --file-key or set FIGMA_FILE_KEY.');
    }

    this.logger.log(`Fetching Figma file ${fileKey}…`);
    const file = await this.figma.getFile(fileKey);
    const frames = getTopLevelFrames(file.document);
    this.logger.log(`Found ${frames.length} top-level frame(s).`);

    const validComponentIds = this.mapper.getValidComponentIds();
    const images = options.withImages
      ? await this.figma.getImages(fileKey, frames.map((f) => f.id))
      : {};

    let ok = 0;
    for (const frame of frames) {
      try {
        const reduced = reduceNode(frame);
        const page = await this.extractor.extractPage(reduced, {
          validComponentIds,
          imageUrl: images[frame.id],
        });
        const mappedPage = this.mapper.mapPage(page);

        const extraction = FigmaPageExtractionSchema.parse({
          figma_node_id: frame.id,
          figma_file_key: fileKey,
          figma_version: file.version,
          name: frame.name,
          tenant_id: options.tenant ?? null,
          extracted_at: new Date().toISOString(),
          page: mappedPage,
        });

        if (options.dryRun) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(extraction, null, 2));
        } else {
          await this.repo.upsertPage(extraction);
          this.logger.log(`Upserted page_layouts/${frame.id} ("${frame.name}").`);
        }
        ok++;
      } catch (err) {
        this.logger.error(
          `Frame "${frame.name}" (${frame.id}) failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    this.logger.log(
      `Done: ${ok}/${frames.length} frame(s) extracted${options.dryRun ? ' (dry-run, nothing written)' : ''}.`,
    );

    // Auto-refresh the RAG index for this tenant once extraction wrote something.
    // Best-effort: a missing VOYAGE_API_KEY (or any embed error) must not fail
    // the extraction that already succeeded. Skip on dry-run or --no-index.
    if (!options.dryRun && !options.skipIndex && ok > 0) {
      try {
        this.logger.log('Refreshing RAG index…');
        const res = await this.indexBuilder.buildIndex(options.tenant);
        this.logger.log(
          `Index: ${res.embedded} embedded, ${res.skipped} unchanged, ${res.pruned} pruned.`,
        );
      } catch (err) {
        this.logger.warn(
          `Skipped RAG index refresh: ${err instanceof Error ? err.message : String(err)}. ` +
            'Run `build-index` manually once VOYAGE_API_KEY is set.',
        );
      }
    }
  }

  @Option({ flags: '--file-key <key>', description: 'Figma file key' })
  parseFileKey(val: string): string {
    return val;
  }

  @Option({ flags: '--tenant <id>', description: 'Tenant id (multi-tenant)' })
  parseTenant(val: string): string {
    return val;
  }

  @Option({ flags: '--dry-run', description: 'Print JSON, do not write to DB' })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: '--with-images',
    description: 'Also send rendered frame images to Claude',
  })
  parseWithImages(): boolean {
    return true;
  }

  @Option({
    flags: '--skip-index',
    description: 'Do not refresh the RAG index after extraction',
  })
  parseSkipIndex(): boolean {
    return true;
  }
}
