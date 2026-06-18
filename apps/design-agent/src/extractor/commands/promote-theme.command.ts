import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import {
  convertExtractionsToTheme,
  firstImageUrl,
  ShopPageLayout,
} from '@ecommerce/schema';
import { MongoRepository } from '../mongo.repository';
import { ThemeRepository } from '../theme.repository';

interface PromoteOptions {
  themeId?: string;
  title?: string;
  description?: string;
  category?: string;
  tenant?: string;
  nodeIds?: string[];
  publish?: boolean;
}

/**
 * `design-agent promote-theme --theme-id=<slug> --title="…" [--tenant=…]
 *  [--node-ids=a,b] [--category=…] [--publish]`
 *
 * Curation step: reads extracted `page_layouts` (by node-ids or tenant),
 * converts them into the editor draft shape, and upserts a `theme_templates`
 * document for the Theme Market. Drafts by default; `--publish` lists it live.
 */
@Command({
  name: 'promote-theme',
  description: 'Curate extracted page_layouts into a Theme Market theme.',
})
export class PromoteThemeCommand extends CommandRunner {
  private readonly logger = new Logger(PromoteThemeCommand.name);

  constructor(
    private readonly repo: MongoRepository,
    private readonly themes: ThemeRepository,
  ) {
    super();
  }

  async run(_params: string[], options: PromoteOptions): Promise<void> {
    if (!options.themeId) throw new Error('--theme-id is required (a slug).');
    if (!options.title) throw new Error('--title is required.');

    const docs = await this.repo.findPages({
      figmaNodeIds: options.nodeIds,
      tenantId: options.nodeIds?.length ? undefined : (options.tenant ?? null),
    });
    if (docs.length === 0) {
      throw new Error(
        'No page_layouts matched. Run `extract` first, or check --tenant/--node-ids.',
      );
    }

    const pages = docs.map((d) => d.page as unknown as ShopPageLayout);
    const { global, pages: outPages } = convertExtractionsToTheme(pages);
    const previewImageUrl = firstImageUrl(pages);

    await this.themes.upsert({
      themeId: options.themeId,
      title: options.title,
      description: options.description,
      category: options.category,
      status: options.publish ? 'published' : 'draft',
      previewImageUrl,
      thumbnails: previewImageUrl ? [previewImageUrl] : [],
      source: {
        figmaFileKey: docs[0].figma_file_key,
        figmaNodeIds: docs.map((d) => d.figma_node_id),
      },
      global,
      pages: outPages,
      tenantId: options.tenant ?? null,
    });

    this.logger.log(
      `Theme "${options.themeId}" upserted from ${docs.length} page(s) ` +
        `(${Object.keys(outPages).join(', ')}) — status: ${
          options.publish ? 'published' : 'draft'
        }.`,
    );
  }

  @Option({ flags: '--theme-id <slug>', description: 'Unique theme slug' })
  parseThemeId(val: string): string {
    return val;
  }

  @Option({ flags: '--title <title>', description: 'Display title' })
  parseTitle(val: string): string {
    return val;
  }

  @Option({ flags: '--description <text>', description: 'Theme description' })
  parseDescription(val: string): string {
    return val;
  }

  @Option({ flags: '--category <name>', description: 'Industry/category label' })
  parseCategory(val: string): string {
    return val;
  }

  @Option({ flags: '--tenant <id>', description: 'Filter extractions by tenant' })
  parseTenant(val: string): string {
    return val;
  }

  @Option({
    flags: '--node-ids <ids>',
    description: 'Comma-separated figma_node_ids to include (overrides --tenant)',
  })
  parseNodeIds(val: string): string[] {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }

  @Option({ flags: '--publish', description: 'Publish immediately (default: draft)' })
  parsePublish(): boolean {
    return true;
  }
}
