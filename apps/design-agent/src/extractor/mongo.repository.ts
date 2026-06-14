import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FigmaPageExtraction } from '@ecommerce/schema';
import { PageLayout, PageLayoutDocument } from './schemas/page-layout.schema';

/**
 * Persists extracted page layouts to MongoDB, upserting by `figma_node_id` so
 * re-running extraction updates the existing document instead of duplicating.
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
        { figma_node_id: extraction.figma_node_id },
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
}
