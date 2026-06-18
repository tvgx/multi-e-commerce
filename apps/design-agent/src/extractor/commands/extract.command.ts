import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { FigmaClient } from '../figma-client.service';
import { ExtractorService } from '../extractor.service';

interface ExtractOptions {
  fileKey?: string;
  tenant?: string;
  dryRun?: boolean;
  noImages?: boolean;
  skipIndex?: boolean;
}

/**
 * `design-agent extract --file-key=XXX [--tenant=YYY] [--dry-run] [--no-images]`
 *
 * Thin CLI wrapper over {@link ExtractorService.extractFrames}: fetches a Figma
 * file, reduces each top-level frame, has Claude map it to a storefront page
 * layout, and (unless --dry-run) upserts the result into MongoDB + refreshes RAG.
 */
@Command({
  name: 'extract',
  description: 'Extract page layouts from a Figma file into MongoDB.',
})
export class ExtractCommand extends CommandRunner {
  private readonly logger = new Logger(ExtractCommand.name);

  constructor(
    private readonly figma: FigmaClient,
    private readonly extractorService: ExtractorService,
  ) {
    super();
  }

  async run(_params: string[], options: ExtractOptions): Promise<void> {
    const fileKey = options.fileKey ?? this.figma.defaultFileKey;
    if (!fileKey) {
      throw new Error('No file key: pass --file-key or set FIGMA_FILE_KEY.');
    }

    const result = await this.extractorService.extractFrames({
      fileKey,
      tenant: options.tenant ?? null,
      noImages: options.noImages,
      persist: !options.dryRun,
    });

    if (options.dryRun) {
      for (const e of result.extractions) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(e, null, 2));
      }
    }

    this.logger.log(
      `Done: ${result.ok}/${result.total} frame(s) extracted${
        options.dryRun ? ' (dry-run, nothing written)' : ''
      }.`,
    );

    // Refresh the RAG index once extraction wrote something (skip on dry-run/opt-out).
    if (!options.dryRun && !options.skipIndex && result.ok > 0) {
      await this.extractorService.refreshIndex(options.tenant);
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
    flags: '--no-images',
    description: 'Do not send rendered frame images to Claude (images on by default)',
  })
  parseNoImages(): boolean {
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
