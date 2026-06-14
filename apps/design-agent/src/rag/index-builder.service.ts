import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageLayout, PageLayoutDocument } from '../extractor/schemas/page-layout.schema';
import { LayoutChunkerService, PageLayoutRecord } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import {
  EmbeddingIndexRepository,
  StoredEmbedding,
} from './embedding-index.repository';

export interface BuildIndexResult {
  pages: number;
  chunks: number;
  embedded: number;
  skipped: number;
  pruned: number;
}

/**
 * Builds (or refreshes) the `layout_embeddings` index from `page_layouts`.
 *
 * Idempotent: each chunk carries a `content_hash`; a chunk whose hash already
 * matches the stored row is skipped (no re-embed, no Voyage call), so re-running
 * after extraction only embeds what actually changed. Sections that disappeared
 * from a page are pruned from the index.
 */
@Injectable()
export class IndexBuilderService {
  private readonly logger = new Logger(IndexBuilderService.name);

  constructor(
    @InjectModel(PageLayout.name)
    private readonly pageModel: Model<PageLayoutDocument>,
    private readonly chunker: LayoutChunkerService,
    private readonly embedder: EmbeddingService,
    private readonly repo: EmbeddingIndexRepository,
  ) {}

  async buildIndex(tenantId?: string): Promise<BuildIndexResult> {
    const filter = tenantId === undefined ? {} : { tenant_id: tenantId };
    const docs = (await this.pageModel
      .find(filter)
      .lean()
      .exec()) as unknown as PageLayoutRecord[];

    const chunks = docs.flatMap((doc) => this.chunker.chunkPage(doc));
    this.logger.log(
      `Chunked ${docs.length} page(s) into ${chunks.length} section chunk(s)` +
        (tenantId === undefined ? '' : ` for tenant "${tenantId}"`) +
        '.',
    );

    const existing = await this.repo.getHashes(tenantId);
    const stale = chunks.filter((c) => existing.get(c.chunk_id) !== c.content_hash);
    const skipped = chunks.length - stale.length;

    let embedded = 0;
    if (stale.length > 0) {
      const vectors = await this.embedder.embed(
        stale.map((c) => c.content),
        'document',
      );
      const rows: StoredEmbedding[] = stale.map((c, i) => ({
        ...c,
        embedding: vectors[i],
        embedding_model: this.embedder.model,
      }));
      await this.repo.upsertMany(rows);
      embedded = rows.length;
    }

    const pruned = await this.prune(chunks, tenantId);

    const result: BuildIndexResult = {
      pages: docs.length,
      chunks: chunks.length,
      embedded,
      skipped,
      pruned,
    };
    this.logger.log(
      `Index build done: ${embedded} embedded, ${skipped} unchanged, ${pruned} pruned.`,
    );
    return result;
  }

  /** Remove stored chunks for this scope that no longer exist in the layouts. */
  private async prune(
    current: { chunk_id: string }[],
    tenantId?: string,
  ): Promise<number> {
    const live = new Set(current.map((c) => c.chunk_id));
    const stored = await this.repo.getChunkIds(tenantId);
    const orphans = stored.filter((id) => !live.has(id));
    return this.repo.deleteByChunkIds(orphans);
  }
}
