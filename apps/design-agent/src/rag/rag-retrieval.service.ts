import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { EmbeddingIndexRepository } from './embedding-index.repository';
import { cosineSimilarity } from './similarity';

export interface RetrieveOptions {
  /** Multi-tenant filter. Omit to search across all tenants. */
  tenant_id?: string;
  /** Number of chunks to return (default 5). */
  k?: number;
}

export interface RetrievedChunk {
  score: number;
  chunk_id: string;
  page_id: string;
  section_id: string;
  tenant_id: string | null;
  page_name: string;
  section_name: string;
  section_type: string;
  page_type: string;
  content: string;
}

/**
 * Retrieves the most relevant layout sections for a natural-language query.
 *
 * Hybrid by design: a hard metadata filter on `tenant_id` (mandatory isolation
 * in this multi-tenant DB) followed by vector ranking. The query is embedded
 * with Voyage `input_type: "query"`, scored against stored chunk vectors by
 * cosine similarity in the app layer, and the top-k are returned with metadata.
 *
 * This is the entrypoint the future layout chatbot calls to build context.
 */
@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name);

  constructor(
    private readonly embedder: EmbeddingService,
    private readonly repo: EmbeddingIndexRepository,
  ) {}

  async retrieveContext(
    query: string,
    options: RetrieveOptions = {},
  ): Promise<RetrievedChunk[]> {
    const k = options.k ?? 5;
    const candidates = await this.repo.findForRetrieval(options.tenant_id);
    if (candidates.length === 0) {
      this.logger.warn(
        `No embeddings to search${
          options.tenant_id ? ` for tenant "${options.tenant_id}"` : ''
        }. Run build-index first.`,
      );
      return [];
    }

    const [queryVec] = await this.embedder.embed([query], 'query');

    return candidates
      .map((c) => ({
        score: cosineSimilarity(queryVec, c.embedding),
        chunk_id: c.chunk_id,
        page_id: c.page_id,
        section_id: c.section_id,
        tenant_id: c.tenant_id,
        page_name: c.page_name,
        section_name: c.section_name,
        section_type: c.section_type,
        page_type: c.page_type,
        content: c.content,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
