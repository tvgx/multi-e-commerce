import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const DEFAULT_MODEL = 'voyage-3';
/** Voyage caps a request at 128 inputs; we batch larger sets ourselves. */
const MAX_BATCH = 128;

export type EmbedInputType = 'document' | 'query';

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage?: { total_tokens?: number };
}

/**
 * Embeds text with Voyage AI (`voyage-3` by default). api-core has no existing
 * embedding provider to reuse, so this is the single source of embeddings for
 * the design-agent. Voyage ships no official Node SDK, so we call the REST API
 * with the global `fetch`. `input_type` should be `"document"` when indexing
 * chunks and `"query"` at retrieval time — Voyage embeds them into a shared,
 * asymmetric space that improves recall.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly config: ConfigService) {}

  get model(): string {
    return this.config.get<string>('VOYAGE_MODEL') || DEFAULT_MODEL;
  }

  /** Embed a batch of texts, preserving input order in the returned vectors. */
  async embed(texts: string[], inputType: EmbedInputType): Promise<number[][]> {
    if (texts.length === 0) return [];

    const apiKey = this.config.get<string>('VOYAGE_API_KEY');
    if (!apiKey) {
      throw new Error(
        'VOYAGE_API_KEY is not set. Add it to the root .env to build the RAG index.',
      );
    }

    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH) {
      const batch = texts.slice(i, i + MAX_BATCH);
      out.push(...(await this.embedBatch(batch, inputType, apiKey)));
    }
    return out;
  }

  private async embedBatch(
    input: string[],
    inputType: EmbedInputType,
    apiKey: string,
  ): Promise<number[][]> {
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, model: this.model, input_type: inputType }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Voyage embeddings failed: ${res.status} ${detail}`);
    }

    const json = (await res.json()) as VoyageResponse;
    // Sort by `index` so vectors line up with the input order regardless of
    // the order Voyage returns them in.
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    this.logger.debug(
      `Embedded ${input.length} text(s) with ${json.model} ` +
        `(${json.usage?.total_tokens ?? '?'} tokens).`,
    );
    return sorted.map((d) => d.embedding);
  }
}
