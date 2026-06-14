import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { RagRetrievalService } from '../rag-retrieval.service';

interface QueryOptions {
  tenant?: string;
  k?: number;
}

/**
 * `design-agent rag-query "your question" [--tenant=XXX] [--k=5]`
 *
 * Manual smoke-test for {@link RagRetrievalService}: prints the top-k retrieved
 * sections with scores. The chatbot will call the service directly.
 */
@Command({
  name: 'rag-query',
  arguments: '<query>',
  description: 'Retrieve the most relevant layout sections for a query.',
})
export class RagQueryCommand extends CommandRunner {
  private readonly logger = new Logger(RagQueryCommand.name);

  constructor(private readonly retrieval: RagRetrievalService) {
    super();
  }

  async run(params: string[], options: QueryOptions): Promise<void> {
    const query = params.join(' ').trim();
    if (!query) {
      throw new Error('Provide a query, e.g. rag-query "hero section on home"');
    }

    const hits = await this.retrieval.retrieveContext(query, {
      tenant_id: options.tenant,
      k: options.k ?? 5,
    });

    if (hits.length === 0) {
      this.logger.warn('No results. Build the index first (build-index).');
      return;
    }

    for (const [i, h] of hits.entries()) {
      // eslint-disable-next-line no-console
      console.log(
        `${i + 1}. [${h.score.toFixed(4)}] ${h.page_name} › ${h.section_name} ` +
          `(${h.section_type}) — section_id=${h.section_id}`,
      );
    }
  }

  @Option({ flags: '--tenant <id>', description: 'Restrict to this tenant' })
  parseTenant(val: string): string {
    return val;
  }

  @Option({ flags: '--k <n>', description: 'Number of results (default 5)' })
  parseK(val: string): number {
    return parseInt(val, 10);
  }
}
