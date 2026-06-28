# Theme Editor — Handoff

> Mục tiêu chung: trình thiết kế shop thân thiện hơn với người không rành kỹ
> thuật (cảm hứng: setup kiểu **Haravan** + chỉnh chi tiết kiểu **Shopify**),
> theme đơn giản sáng/tối, preview trung thực.
>
> Cập nhật: 2026-06-24. Người chốt hướng: chủ dự án (xem Q&A trong plan
> `~/.claude/plans/polished-greeting-bachman.md`).

---

## ĐÃ LÀM (đợt này) — Setup + Preview

### 1. Theme tokens "thật" + tất cả section ăn theo theme
- **Storefront layout** [apps/storefront/src/app/[shopSlug]/(buyer-view)/layout.tsx](../apps/storefront/src/app/%5BshopSlug%5D/(buyer-view)/layout.tsx): wrapper emit đủ biến `--theme-primary/-bg/-text/-button/-button-text/-heading-font/-body-font` + `fontFamily` từ `globalLayout.theme` (đều có default = emerald/sáng cũ → shop cũ không vỡ). Thêm `generateMetadata` để **favicon + title theo từng shop** (đọc `theme.faviconUrl`).
- **Storefront globals** [apps/storefront/src/app/globals.css](../apps/storefront/src/app/globals.css): thêm token `--color-brand-fg`, `--color-button`, `--color-button-fg` (đã có `--color-brand`). Thêm `@source "../../../../packages/ui-registry/src"` để Tailwind chắc chắn sinh các tiện ích `brand`.
- **De-emerald toàn bộ section** trong `packages/ui-registry/src/components/sections/**` + `FeaturedProducts.tsx`: thay `*-emerald-*` → tiện ích `brand` (giữ opacity), text sáng trên nền tối → `white`, viền editorial tối → `white/20`. **Còn lại 0 emerald** trong sections (grep sạch). Lưu ý: các file **builder chrome** (`builder/*`, `ui/toaster.tsx`) cố ý GIỮ emerald — sẽ xử lý ở Phase A.
- **Canvas builder** [packages/ui-registry/src/components/builder/canvas-renderer.tsx](../packages/ui-registry/src/components/builder/canvas-renderer.tsx): wrapper set `--theme-*` + `backgroundColor/color/fontFamily` từ store theme → preview phản ánh ngay khi đổi màu.

### 2. Global Setup stage (cổng vào editor)
- **Component mới** [apps/admin/src/components/builder/SetupWizard.tsx](../apps/admin/src/components/builder/SetupWizard.tsx): 5 bước — Thương hiệu (tên + tagline) · Màu & Chữ (5 preset 1-click + 5 màu + 2 font) · Logo & Favicon (upload qua `/api/media/upload`, **khuyến khích không bắt buộc**) · Liên hệ (facebook/instagram/tiktok/youtube/email/phone) · Header & Footer (thanh thông báo + dòng bản quyền). Ghi hết vào `theme` JSON qua `setTheme`, đẩy logo→Header & copyright→Footer qua `updateGlobalComponent`, rồi `saveTemplate` + `PATCH /api/shops/:id` cập nhật `Shop.name`. Cờ hoàn tất: `theme.setupCompleted`.
- **Gateway**: [builder/page.tsx](../apps/admin/src/app/dashboard/%5BshopId%5D/online-store/builder/page.tsx) và [create-shop/design/page.tsx](../apps/admin/src/app/create-shop/design/page.tsx) hiện SetupWizard nếu `!theme.setupCompleted`. Nút **"Thiết lập chung"** trên toolbar + sự kiện `builder:open-setup` (PropEditor phát) để mở lại.
- **Bỏ hỏi tên shop** ở create-shop bước 1 [create-shop/page.tsx](../apps/admin/src/app/create-shop/page.tsx): giờ chỉ hỏi domain; tên tạm suy từ domain, tên thật đặt trong Setup.
- **PropEditor** [PropEditor.tsx](../apps/admin/src/components/builder/PropEditor.tsx): panel "chưa chọn gì" không còn form màu trùng — chỉ còn nút mở Setup + xem màu/tên hiện tại.

### 3. Preview trung thực
- Canvas nhận `previewProducts` (sản phẩm thật, fetch `/api/catalog/products/shop/:shopId?limit=12` ở 2 page builder). Trống → dùng **catalog mẫu có ảnh placeholder** (picsum) kiểu Haravan + chip "Dữ liệu minh hoạ". Empty-state (trang chưa có section) làm thân thiện hơn.

### Verify đã chạy
`npx tsc --noEmit` cho **ui-registry / admin / storefront** đều exit 0. Grep `emerald` trong `sections/**` = sạch.

### Follow-up nhỏ (chưa làm, không chặn)
- Social links (`theme.social`) đã LƯU nhưng footer storefront chưa render ra icon — cần thêm vào Footer component.
- Storefront wrapper chưa áp `theme.backgroundColor` ra nền trang (mới expose biến); cân nhắc nếu muốn nền trang đổi theo theme.
- Thanh thông báo (`theme.announcementText`) đã lưu nhưng chưa wire ra AnnouncementBar ở storefront.

---

## CÒN LẠI (đã chốt hướng) — làm ở các đợt sau

### Phase A — Admin light/dark **toàn bộ dashboard** (mặc định Sáng + nút chuyển)
- **Token**: [apps/admin/src/app/globals.css](../apps/admin/src/app/globals.css) đã có bộ HSL shadcn (`--background`,`--foreground`,`--card`,`--primary`…) ở `:root` (đang sáng). Thêm khối `.dark { --background: …; … }` + khai báo dark variant cho Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *));`.
- **Toggle**: nút Sáng/Tối (lib localStorage, set class `dark` trên `<html>`); khởi tạo trong `apps/admin/src/app/layout.tsx` (script chống nhấp nháy). Mặc định **sáng**.
- **Refactor hardcode hex → token**: đổi `bg-[#0a0a0f]`, `bg-[#030014]`, `bg-[#050510]`, `bg-slate-900/950`, `text-white`, `border-white/5`… sang `bg-background`/`bg-card`/`text-foreground`/`text-muted-foreground`/`border-border`. File chính:
  - [builder/page.tsx](../apps/admin/src/app/dashboard/%5BshopId%5D/online-store/builder/page.tsx), [SectionList.tsx](../apps/admin/src/components/builder/SectionList.tsx), [PropEditor.tsx](../apps/admin/src/components/builder/PropEditor.tsx), [create-shop/page.tsx](../apps/admin/src/app/create-shop/page.tsx), [create-shop/design/page.tsx](../apps/admin/src/app/create-shop/design/page.tsx), [GlobalSidebar.tsx](../apps/admin/src/components/platform/GlobalSidebar.tsx), builder chrome trong `packages/ui-registry/src/components/builder/*` + `ui/toaster.tsx`.
  - **SetupWizard.tsx đã viết sẵn bằng token** (`bg-background/bg-card/text-foreground/border-border`) → tự đúng cả 2 chế độ, dùng làm mẫu.

### Phase B — Block thật lồng nhau cho thẻ sản phẩm (nâng cấp section hiện có)
- Mục tiêu: trong section như **Sản phẩm nổi bật**, mỗi thẻ SP có các block con **Ảnh / Tên / Giá / Nút / Đánh giá** — ẩn/hiện, đổi tên, kéo-thả.
- **Schema**: thêm `allowedBlocks`/`defaultBlocks` cho `FeaturedProductsSchema`/`RecommendedProductsSchema` (trong [component-schemas.ts](../packages/ui-registry/src/component-schemas.ts) + schema cạnh component). Dùng block có sẵn: `Media`, `Heading`/`Text`, `Button` ([blocks/*](../packages/ui-registry/src/components/blocks)).
- **Render**: sửa [FeaturedProducts.tsx](../packages/ui-registry/src/components/sections/products/FeaturedProducts.tsx) / [RecommendedProducts.tsx](../packages/ui-registry/src/components/sections/products/RecommendedProducts.tsx) để map theo `blocks` (tôn trọng `isHidden` — đã có cờ trong `UIComponentRef`) thay vì hardcode.
- **Store đã sẵn**: `addBlock`, `removeBlock`, `reorderBlocks`, `toggleBlockVisibility` ([builder-store.ts](../packages/ui-registry/src/store/builder-store.ts)) — không cần viết lại logic, chỉ cần wire UI + render.

### Phase C — Tree UX (ẩn/hiện · đổi tên · duplicate · kéo-thả block)
- [SectionList.tsx](../apps/admin/src/components/builder/SectionList.tsx) (`BlockItem`):
  - **Ẩn/hiện**: thêm icon con-mắt gọi `toggleBlockVisibility(block.id)`; node ẩn hiển thị mờ + canvas bỏ qua (render theo `isHidden`).
  - **Đổi tên**: thêm field `name?: string` vào `UIComponentRef` ([packages/schema/src/layout.schema.ts](../packages/schema/src/layout.schema.ts)) + action `renameNode(id, name)` trong store; tree hiện `node.name || schema.title`.
  - **Duplicate**: thêm action `duplicateBlock(id)` (clone + uuid mới, chèn kế bên).
  - **Kéo-thả block**: bọc block tree bằng `DndContext`/`SortableContext` (đã dùng cho section) gọi `reorderBlocks(parentId, from, to)`.
- Cây nên **luôn hiện rõ** (đỡ thu gọn mặc định) để người mới thấy cấu trúc — cân nhắc mở sẵn section đang chọn.

---

## Bối cảnh kỹ thuật cần nhớ
- `theme` là **JSON blob** (`Record<string,any>`) lưu qua `/api/layouts/builder/save/global`; thêm field tự do, **không cần migration**. Bảng `Shop` không có cột logo/favicon/social/color.
- Cầu màu: `--color-brand: var(--theme-primary, #059669)` ở cả admin & storefront globals → `text-brand/bg-brand/...` ăn theo màu chủ đạo. `--color-button`/`--color-button-fg`/`--color-brand-fg` tương tự.
- 2 model nhóm sản phẩm song song (Collection vs Category) — xem memory `storefront-categories-loading`.
