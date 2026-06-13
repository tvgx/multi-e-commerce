import type { LayoutService } from '../../../apps/api-core/src/modules/layout/layout.service';

type Assembled = ReturnType<LayoutService['assembleLayout']>;

/**
 * Stage 03 — Layout Compiler.
 * Chuẩn hóa cấu trúc + materialize toàn bộ ảnh (Global + từng Page) lên MinIO
 * (shop-layouts/<shopId>/pub-<sha1>), dùng chung 1 cache để không tải lại trùng.
 * Logic materialize idempotent nằm trong LayoutService.compilePublished (tái dùng).
 */
export async function compileLayout(
  layoutService: LayoutService,
  shopId: string,
  assembled: Assembled,
  cache: Map<string, string>,
) {
  return layoutService.compilePublished(shopId, assembled, cache);
}
