import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ThemeTemplateDocument = ThemeTemplate & Document;

/**
 * Local mirror of the shared `theme_templates` collection (canonical model in
 * @ecommerce/database). Defined here so design-agent can write themes without
 * depending on the api-core Nest graph — same pattern as the page_layouts
 * schema. Keep field names in sync with packages/database/src/mongodb/models.ts.
 */
@Schema({ timestamps: true, collection: 'theme_templates' })
export class ThemeTemplate {
  @Prop({ type: String, required: true, unique: true, index: true })
  themeId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, index: true })
  category: string;

  @Prop({ type: String, enum: ['draft', 'pending', 'published'], default: 'draft', index: true })
  status: 'draft' | 'pending' | 'published';

  @Prop({ type: String })
  previewImageUrl: string;

  @Prop({ type: [String], default: [] })
  thumbnails: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  source: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  global: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  pages: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  assetKeys: string[];

  @Prop({ type: String, default: null, index: true })
  tenantId: string | null;

  @Prop({ type: String, default: null, index: true })
  ownerUserId: string | null;

  @Prop({ type: String, default: null })
  ownerShopId: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: { isPaid: false, priceCents: 0, currency: 'VND' } })
  pricing: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  review: Record<string, unknown>;

  @Prop({ type: Number, default: 1 })
  version: number;
}

export const ThemeTemplateSchema = SchemaFactory.createForClass(ThemeTemplate);
