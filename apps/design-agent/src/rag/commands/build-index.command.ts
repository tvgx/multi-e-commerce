import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { IndexBuilderService } from '../index-builder.service';

interface BuildIndexOptions {
  tenant?: string;
}

/**
 * `design-agent build-index [--tenant=XXX]`
 *
 * Embeds every section in `page_layouts` (or just one tenant's) into
 * `layout_embeddings`. Idempotent — unchanged sections are skipped.
 */
@Command({
  name: 'build-index',
  description: 'Embed page_layouts sections into the layout_embeddings index.',
})
export class BuildIndexCommand extends CommandRunner {
  private readonly logger = new Logger(BuildIndexCommand.name);

  constructor(private readonly indexBuilder: IndexBuilderService) {
    super();
  }

  async run(_params: string[], options: BuildIndexOptions): Promise<void> {
    const result = await this.indexBuilder.buildIndex(options.tenant);
    this.logger.log(
      `build-index: pages=${result.pages} chunks=${result.chunks} ` +
        `embedded=${result.embedded} unchanged=${result.skipped} pruned=${result.pruned}`,
    );
  }

  @Option({
    flags: '--tenant <id>',
    description: 'Only (re)index this tenant',
  })
  parseTenant(val: string): string {
    return val;
  }
}
