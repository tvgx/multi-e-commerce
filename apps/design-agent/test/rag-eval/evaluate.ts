import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { RagRetrievalService } from '../../src/rag/rag-retrieval.service';

/**
 * RAG retrieval evaluation: computes recall@k and precision@k over the cases in
 * test_cases.json against the live `layout_embeddings` index.
 *
 *   recall@k    = (relevant section_ids found in top-k) / (all relevant)
 *   precision@k = (relevant section_ids found in top-k) / k
 *
 * Run after building the index (needs MONGO_DB_ATLAS + VOYAGE_API_KEY):
 *   npm run rag-eval            # k defaults to 5
 *   npm run rag-eval -- --k=3
 */

interface EvalCase {
  id: string;
  query: string;
  tenant_id?: string;
  expected_section_ids: string[];
}

function parseK(): number {
  const arg = process.argv.find((a) => a.startsWith('--k='));
  return arg ? parseInt(arg.split('=')[1], 10) : 5;
}

async function main(): Promise<void> {
  const k = parseK();
  const file = path.resolve(__dirname, 'test_cases.json');
  const cases = (JSON.parse(fs.readFileSync(file, 'utf8')).cases ??
    []) as EvalCase[];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });
  const rag = app.get(RagRetrievalService);

  let recallSum = 0;
  let precisionSum = 0;

  // eslint-disable-next-line no-console
  console.log(`\nRAG retrieval eval — k=${k}, ${cases.length} case(s)\n`);

  for (const c of cases) {
    const hits = await rag.retrieveContext(c.query, {
      tenant_id: c.tenant_id,
      k,
    });
    const retrieved = hits.map((h) => h.section_id);
    const expected = new Set(c.expected_section_ids);
    const found = retrieved.filter((id) => expected.has(id));
    const hitCount = new Set(found).size;

    const recall = expected.size ? hitCount / expected.size : 0;
    const precision = k ? hitCount / k : 0;
    recallSum += recall;
    precisionSum += precision;

    const status = hitCount === expected.size ? '✓' : hitCount > 0 ? '~' : '✗';
    // eslint-disable-next-line no-console
    console.log(
      `${status} ${c.id.padEnd(28)} recall=${recall.toFixed(2)} ` +
        `precision=${precision.toFixed(2)}  top-${k}=[${retrieved.join(', ')}]`,
    );
  }

  const n = cases.length || 1;
  // eslint-disable-next-line no-console
  console.log(
    `\nMean recall@${k}=${(recallSum / n).toFixed(3)}  ` +
      `mean precision@${k}=${(precisionSum / n).toFixed(3)}\n`,
  );

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
