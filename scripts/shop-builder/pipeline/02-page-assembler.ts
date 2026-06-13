import type { LayoutService } from '../../../apps/api-core/src/modules/layout/layout.service';

type Extracted = Awaited<ReturnType<LayoutService['extractDraft']>>;

/**
 * Stage 02 — Page Assembler (core logic theo doc).
 * Lắp ghép Global (Header/Footer) với từng Page, validate cấu trúc và resolve link
 * điều hướng. Layout đã được lưu theo global + page riêng nên đây là pass-through
 * có kiểm tra (link đã là URL cụ thể do NavigationEditor ghi sẵn).
 */
export function assemblePages(layoutService: LayoutService, extracted: Extracted) {
  return layoutService.assembleLayout(extracted);
}
