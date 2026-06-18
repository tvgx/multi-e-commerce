import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ThemeTemplate,
  ThemeTemplateDocument,
} from './schemas/theme-template.schema';

export interface ThemeUpsert {
  themeId: string;
  title: string;
  description?: string;
  category?: string;
  status?: 'draft' | 'pending' | 'published';
  previewImageUrl?: string;
  thumbnails?: string[];
  source?: Record<string, unknown>;
  global: Record<string, unknown>;
  pages: Record<string, unknown>;
  tenantId?: string | null;
  ownerUserId?: string | null;
  ownerShopId?: string | null;
}

/** Writes curated themes into the shared `theme_templates` collection. */
@Injectable()
export class ThemeRepository {
  constructor(
    @InjectModel(ThemeTemplate.name)
    private readonly model: Model<ThemeTemplateDocument>,
  ) {}

  /** Upsert a theme by `themeId` (re-curating the same id updates in place). */
  async upsert(theme: ThemeUpsert): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { themeId: theme.themeId },
        {
          $set: {
            title: theme.title,
            description: theme.description ?? '',
            category: theme.category,
            status: theme.status ?? 'draft',
            previewImageUrl: theme.previewImageUrl,
            thumbnails: theme.thumbnails ?? [],
            source: theme.source ?? {},
            global: theme.global,
            pages: theme.pages,
            tenantId: theme.tenantId ?? null,
            ownerUserId: theme.ownerUserId ?? null,
            ownerShopId: theme.ownerShopId ?? null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
