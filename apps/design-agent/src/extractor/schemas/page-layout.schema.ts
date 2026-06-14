import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PageLayoutDocument = PageLayout & Document;

/**
 * MongoDB document for an extracted page layout. The `page` field holds the
 * storefront-renderable `ShopPageLayout` (kept as Mixed because its component
 * tree is recursive). `figma_node_id` is the unique upsert key.
 */
@Schema({ timestamps: true, collection: 'page_layouts' })
export class PageLayout {
  @Prop({ type: String, required: true, unique: true, index: true })
  figma_node_id: string;

  @Prop({ type: String, required: true })
  figma_file_key: string;

  @Prop({ type: String })
  figma_version: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, default: null, index: true })
  tenant_id: string | null;

  @Prop({ type: Date, default: Date.now })
  extracted_at: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  page: Record<string, unknown>;
}

export const PageLayoutSchema = SchemaFactory.createForClass(PageLayout);
