import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LayoutEmbeddingDocument = LayoutEmbedding & Document;

/**
 * One embedded layout section. `chunk_id` (`${page_id}::${section_id}`) is the
 * unique upsert key; `content_hash` lets the index job skip re-embedding
 * unchanged chunks. The `embedding` vector is stored inline and scored in the
 * app layer (self-hosted Mongo has no vector index).
 */
@Schema({ timestamps: true, collection: 'layout_embeddings' })
export class LayoutEmbedding {
  @Prop({ type: String, required: true, unique: true, index: true })
  chunk_id: string;

  @Prop({ type: String, required: true, index: true })
  page_id: string;

  @Prop({ type: String, required: true })
  section_id: string;

  @Prop({ type: String, default: null, index: true })
  tenant_id: string | null;

  @Prop({ type: String })
  figma_node_id: string;

  @Prop({ type: String })
  page_name: string;

  @Prop({ type: String })
  section_name: string;

  @Prop({ type: String })
  section_type: string;

  @Prop({ type: String })
  page_type: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  content_hash: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop({ type: String, required: true })
  embedding_model: string;
}

export const LayoutEmbeddingSchema = SchemaFactory.createForClass(LayoutEmbedding);
