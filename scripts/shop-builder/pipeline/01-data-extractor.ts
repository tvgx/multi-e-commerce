import type { LayoutService } from '../../../apps/api-core/src/modules/layout/layout.service';

/**
 * Stage 01 — Data Extractor.
 * Kéo toàn bộ draft của shop (Global layout + các Page có nội dung) từ MongoDB
 * và validate sơ bộ. Logic thật nằm trong LayoutService.extractDraft (tái dùng).
 */
export async function extractData(layoutService: LayoutService, shopId: string) {
  return layoutService.extractDraft(shopId);
}
