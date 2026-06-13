import type { LayoutService } from '../../../apps/api-core/src/modules/layout/layout.service';

type Compiled = Awaited<ReturnType<LayoutService['compilePublished']>>;

/**
 * Stage 04 — Storage Publisher.
 * Ghi publishedData về Mongo (Global + bulk Pages), đánh dấu Shop = PUBLISHED,
 * và tính URL storefront chính thức. Tất cả tái dùng LayoutService.
 */
export async function publishStorage(
  layoutService: LayoutService,
  shopId: string,
  compiled: Compiled,
): Promise<string> {
  await layoutService.persistPublished(shopId, compiled.compiledGlobal, compiled.compiledPages);
  await layoutService.markShopPublished(shopId);
  return layoutService.buildStorefrontUrl(shopId);
}
