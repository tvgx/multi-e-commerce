import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LayoutEmbedding,
  LayoutEmbeddingDocument,
} from './schemas/layout-embedding.schema';

export interface StoredEmbedding {
  chunk_id: string;
  page_id: string;
  section_id: string;
  tenant_id: string | null;
  figma_node_id: string;
  page_name: string;
  section_name: string;
  section_type: string;
  page_type: string;
  order: number;
  content: string;
  content_hash: string;
  embedding: number[];
  embedding_model: string;
}

/**
 * Read/write access to the `layout_embeddings` collection. Upserts are keyed by
 * `chunk_id` so re-running the index job updates in place rather than
 * duplicating.
 */
@Injectable()
export class EmbeddingIndexRepository {
  constructor(
    @InjectModel(LayoutEmbedding.name)
    private readonly model: Model<LayoutEmbeddingDocument>,
  ) {}

  /** Map of chunk_id → content_hash for the given tenant scope (or all). */
  async getHashes(tenantId?: string): Promise<Map<string, string>> {
    const filter = tenantScope(tenantId);
    const rows = await this.model
      .find(filter, { chunk_id: 1, content_hash: 1 })
      .lean()
      .exec();
    return new Map(rows.map((r) => [r.chunk_id, r.content_hash]));
  }

  async upsertMany(items: StoredEmbedding[]): Promise<void> {
    if (items.length === 0) return;
    await this.model.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { chunk_id: item.chunk_id },
          update: { $set: item },
          upsert: true,
        },
      })),
    );
  }

  /** Drop embeddings whose chunk_id no longer exists in the current layouts. */
  async deleteByChunkIds(chunkIds: string[]): Promise<number> {
    if (chunkIds.length === 0) return 0;
    const res = await this.model
      .deleteMany({ chunk_id: { $in: chunkIds } })
      .exec();
    return res.deletedCount ?? 0;
  }

  /** Load candidate vectors for retrieval, optionally filtered by tenant. */
  async findForRetrieval(tenantId?: string): Promise<StoredEmbedding[]> {
    return this.model
      .find(tenantScope(tenantId))
      .lean()
      .exec() as unknown as Promise<StoredEmbedding[]>;
  }

  /** All chunk_ids currently stored for a tenant scope. */
  async getChunkIds(tenantId?: string): Promise<string[]> {
    const rows = await this.model
      .find(tenantScope(tenantId), { chunk_id: 1 })
      .lean()
      .exec();
    return rows.map((r) => r.chunk_id);
  }
}

/**
 * `undefined` tenant = index/search across all tenants; an explicit tenant id
 * scopes to that tenant only. (A literal `null` tenant_id is stored for layouts
 * extracted without `--tenant`.)
 */
function tenantScope(tenantId?: string): Record<string, unknown> {
  return tenantId === undefined ? {} : { tenant_id: tenantId };
}
