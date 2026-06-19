import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FigmaPageExtraction } from '@ecommerce/schema';
import { PageLayout, PageLayoutDocument } from './schemas/page-layout.schema';

/** Lean shape of a page_layouts document (fields used by theme curation). */
export interface PageLayoutRecord {
  figma_node_id: string;
  figma_file_key: string;
  name?: string;
  tenant_id: string | null;
  page: Record<string, unknown>;
}

/**
 * Persists extracted page layouts to MongoDB, upserting by the compound key
 * `(figma_node_id, tenant_id)` so re-running extraction updates the existing
 * document instead of duplicating — and so two tenants importing the same Figma
 * file keep separate documents instead of overwriting each other (EXTR-1).
 */
@Injectable()
export class MongoRepository {
  constructor(
    @InjectModel(PageLayout.name)
    private readonly model: Model<PageLayoutDocument>,
  ) {}

  async upsertPage(extraction: FigmaPageExtraction): Promise<void> {
    await this.model
      .findOneAndUpdate(
        {
          figma_node_id: extraction.figma_node_id,
          tenant_id: extraction.tenant_id ?? null,
        },
        {
          $set: {
            figma_file_key: extraction.figma_file_key,
            figma_version: extraction.figma_version,
            name: extraction.name,
            tenant_id: extraction.tenant_id ?? null,
            extracted_at: extraction.extracted_at,
            page: extraction.page,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  /**
   * Fetch extracted pages for theme curation. Filter by explicit node ids, or by
   * tenant (use `null` for the shared/global extractions). Returns lean docs.
   */
  async findPages(opts: {
    figmaNodeIds?: string[];
    tenantId?: string | null;
  }): Promise<PageLayoutRecord[]> {
    const filter: Record<string, unknown> = {};
    if (opts.figmaNodeIds?.length) {
      filter.figma_node_id = { $in: opts.figmaNodeIds };
    } else if (opts.tenantId !== undefined) {
      filter.tenant_id = opts.tenantId;
    }
    return this.model.find(filter).lean().exec() as unknown as Promise<
      PageLayoutRecord[]
    >;
  }
}
