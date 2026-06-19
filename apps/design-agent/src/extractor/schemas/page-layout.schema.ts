import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PageLayoutDocument = PageLayout & Document;

/**
 * MongoDB document for an extracted page layout. The `page` field holds the
 * storefront-renderable `ShopPageLayout` (kept as Mixed because its component
 * tree is recursive). Upsert key is the compound `(figma_node_id, tenant_id)`
 * — see the compound index below (EXTR-1).
 */
@Schema({ timestamps: true, collection: 'page_layouts' })
export class PageLayout {
  // NOT globally unique: the same Figma file (and therefore the same
  // figma_node_id) can be imported by different tenants. Uniqueness is scoped
  // per tenant via the compound index declared below (EXTR-1).
  @Prop({ type: String, required: true, index: true })
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

// EXTR-1: a figma_node_id is the frame id inside a Figma file, so it is
// IDENTICAL across every tenant that imports the same file. A global unique
// index meant a second tenant's import overwrote the first tenant's document
// (flipping tenant_id), silently stealing the page across the tenant boundary.
// Scope uniqueness to (figma_node_id, tenant_id) instead — `null` (the shared/
// global extraction) is just another distinct tenant value. NOTE: the old
// single-field unique index `figma_node_id_1` must be dropped before this can
// build — see scripts/migrations/2026-06-19-page-layouts-compound-index.ts.
PageLayoutSchema.index({ figma_node_id: 1, tenant_id: 1 }, { unique: true });
