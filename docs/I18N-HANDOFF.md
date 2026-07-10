# i18n Consolidation Handoff (Admin → Storefront)

Mục tiêu: đưa **mọi chuỗi hiển thị** trong app qua `@ecommerce/i18n` để `<html lang>` luôn khớp nội dung (bắt nguồn từ audit SEO trang login admin). Đồng thời chuẩn hoá heading (mỗi trang 1 `<h1>`, không nhảy cấp).

Cập nhật lần cuối: 2026-07-10 (đợt 2). Xem thêm memory `admin-seo-hardening.md`.

> **TRẠNG THÁI:** Admin i18n **HOÀN TẤT** (Batch A–D + analytics + đợt 4 RESIDUAL: builder/legal/hooks/testing/shipping). `tsc` exit 0 + `next build` exit 0, key parity vi↔en 100%. "lang=en trên mọi page" đạt cho toàn bộ visible content; các chuỗi còn VN là ranh giới cố ý (metadata root, tiền tệ, data nghiệp vụ, throw util nội bộ — xem cuối mục 2.RESIDUAL). Storefront (mục 3) chưa bắt đầu.

---

## 0. Bối cảnh đã xong (KHÔNG cần làm lại)

**Đợt SEO hardening (đã build + curl verify):**
- `layout.tsx` (metadataBase, title template `%s — OmniAdmin`, `robots:{index:false}`, viewport), `robots.ts`, `manifest.ts`, `icon.svg`, `apple-icon.tsx`, `opengraph-image.tsx` (next/og), xoá `favicon.ico` 1×1.
- `next.config.ts`: `poweredByHeader:false` + security headers (X-Robots-Tag noindex...).
- `proxy.ts`: no-cookie fast-path → response 1.29s→0.14s. Matcher loại các route metadata.
- 5 trang `(auth)/*` + layout: `<h1>` + i18n (namespace **`admin.auth.*`**) + `generateMetadata` per-route.
- Chrome: `GlobalSidebar` h3→p, `[shopId]/layout.tsx` h2→span; `create-shop/page.tsx` h2→h1.

**Đợt i18n Batch A (đã tsc green, en+vi keys đủ):**
- `dashboard/(platform)/page.tsx` → keys `admin.platformHome.*`
- `dashboard/(platform)/settings/page.tsx` (server, `getT`; h3→h2) → `admin.platformSettings.*`
- `dashboard/(platform)/catalog/page.tsx` (h3→h2) → `admin.catalog.*`
- `dashboard/(platform)/themes/page.tsx` (h3→h2) → `admin.themesMarket.*`
- `dashboard/(platform)/developer/page.tsx` (server, `getT`) → `admin.developerPage.*`
- `dashboard/(platform)/billing/page.tsx` → `admin.billing.*`

**Trang đã dùng i18n từ trước (bỏ qua):** `shops`, `orders/*`, `wallets`, `settings/shipping`, `[shopId]/page.tsx` (phần lớn), `[shopId]/layout.tsx`, `GlobalHeader`, `GlobalSidebar`, các hook `useShopsList/useWallets/useShippingSettings`.

---

## 1. PATTERN chuẩn (bắt buộc theo)

**Client component** (`'use client'`):
```tsx
import { useTranslations } from '@ecommerce/i18n/src/react';
const t = useTranslations('admin');
// ...t('pageKey.subKey')
```
Nếu file có nhiều component con → gọi `useTranslations('admin')` trong TỪNG component (hook chỉ chạy trong React component).

**Server component** (KHÔNG có `'use client'`): làm hàm `async`, dùng
```tsx
import { getT } from '@/lib/i18n';
const t = await getT('admin');
```

**Key naming:** một sub-object trên mỗi trang/khu vực dưới namespace `admin`, ví dụ `admin.products.*`, `admin.inventory.*`. Thêm ĐỒNG THỜI vào **cả `packages/i18n/locales/en/admin.json` VÀ `vi/admin.json`** — thiếu vi = hỏng ở locale mặc định (vi).

**Nội suy:** i18next dùng `{{var}}`. `t('key', { count: n })` với `"key": "up to {{count}} shops"`. `escapeValue:false` nên chuỗi có `<`/emoji an toàn (nhưng KHÔNG nhét HTML tag vào value — tách chuỗi quanh `<strong>` như đã làm ở `catalog.modalDesc1/2`, `billing.noPlan1/2`).

**Heading:** promote chuỗi tiêu đề lớn nhất của trang thành đúng 1 `<h1>`; nếu trang có `<h1>` rồi mà section dùng `<h3>` (không có `<h2>` xen giữa) → đổi `<h3>`→`<h2>` (giữ nguyên className, chỉ đổi tag). **Cẩn thận trang render component con có sẵn heading** (vd `[shopId]/analytics` render `AnalyticsDashboard` có h2) — đọc kỹ cây render trước khi đổi.

**Chuỗi VN hardcode vẫn phải i18n hoá** (không chỉ EN): khớp default vi nhưng lệch khi user switch en. Giá trị vi = giữ nguyên chuỗi cũ, en = bản dịch.

---

## 2. ADMIN — ĐÃ XONG đợt 2 (build xanh)

Tất cả các mục dưới đã convert (en+vi key đủ), heading-skip đã fix (h3→h2 nơi cần), và `next build` exit 0:

**Shop pages `dashboard/[shopId]/`:** `products`, `collections` (+`new` +`[collectionId]` — dùng chung block `admin.collectionForm.*`), `inventory` (h3→h2), `promotions` (h3→h2), `payments` (h1→h2 sections), `settings/domain` (h3→h2, note tách quanh `<strong>TXT/CNAME</strong>`), `placeholder`, `online-store/themes` + `themes/market` + `themes/mine` (block chung `admin.onlineStoreThemes.*`; STATUS_META đổi `label`→`labelKey` + `t()` khi render), `[shopId]/page.tsx` FinalizingView (block `admin.finalizing.*`, `STAGE_LABELS`→`STAGE_LABEL_KEYS`).

**Components:** `ProductForm` (`admin.productForm.*`), `products/ProductPickerModal` (`admin.productPicker.*`), `NotificationBell` (`admin.notifications.*`), `platform/ComingSoonPage` (`admin.comingSoon.*` — **đã thêm `'use client'`** để dùng hook; developer page vẫn pass title/desc qua props).

**Misc:** `app/page.tsx` landing (**server → async + `getT`**, `admin.landing.*`; FeatureCard nhận title/desc đã dịch qua props), `create-shop/page.tsx` (`admin.createShop.*`), `create-shop/billing-shipping/page.tsx` (`admin.billingShipping.*`), `billing-confirm/[token]/page.tsx` (`admin.billingConfirm.*`).

**Analytics group (đợt 3 — build xanh):** cả block `admin.analytics.*` (nested `orderState/payState/dow`). `dashboard/[shopId]/analytics/page.tsx`, `dashboard/(platform)/analytics/page.tsx`, `dashboard/[shopId]/AnalyticsDashboard.tsx`, `dashboard/[shopId]/ChatPanel.tsx` (`admin.chatPanel.*`). Shared `components/analytics/AnalyticsWidgets.tsx`: `ORDER_STATE_LABELS/PAYMENT_STATE_LABELS/DOW_LABELS/PERIOD_OPTIONS` const → **key maps + hook `useAnalyticsLabels()`** (trả `orderStateLabels/paymentStateLabels/dowLabels` đã dịch); `PeriodSelect`+`ChangeBadge` tự `useTranslations`. **Bẫy recharts đã xử lý:** mọi `formatter` đổi từ `name === 'Doanh thu'` sang `item?.dataKey === 'revenue'` (arg thứ 3) — an toàn khi `name` đã dịch.

### 2.RESIDUAL — ĐÃ XONG đợt 4 (build xanh, en+vi parity đủ)

Đợt "lang=en trên MỌI page": convert hết phần VN-only còn lại (visible content). `tsc` exit 0 + `next build` exit 0, key parity vi↔en 100% (0 missing 2 chiều).

- [x] **Builder editors** — `components/builder/SetupWizard.tsx` (block `admin.setupWizard.*`, 62 key: COLOR_PRESETS/STEPS/SOCIAL_FIELDS đổi sang `nameKey/labelKey` dịch tại render; UploadRow nhận `t` qua prop), + `builder/page.tsx`, `PageSwitcher`, `SectionList`, `PropEditor` (`admin.builderTool.*` — đã xong đợt trước).
- [x] **Legal** — `legal/privacy/page.tsx` + `legal/terms/page.tsx` → server component `async` + `generateMetadata` dùng `getT('admin')` (block `admin.legal.*`, 45 key). Giờ render **dynamic (ƒ)** để đọc cookie locale — metadata + body đều theo locale.
- [x] **Hooks (toast/error/confirm/prompt)** — block `admin.hooks.*` (36 key, interpolation `{{msg}}`): `useMyThemes`, `useThemeReview`, `useBillingShipping`, `useOnboardingAutoNav`, `usePaymentSetup`, `usePromotions`, `useInventory`, `useOrders`, `useCreateShop`, `useShippingSettings` (2 toast sót), `useDomainVerification`, `usePlatformCatalog` (dùng `tr` để tránh clash biến `t` của setTimeout). **Bẫy shadowing:** vài `setThemes((t) => …)` / `.map((t) =>` đổi tên biến để không che translator `t`.
- [x] **Dev-only testing tools** — block `admin.testingTool.*` (19 key): `TestingTool`, `ResultsPanel` (2 component → 2× hook; đổi biến map `t`→`tabKey`), `HttpScenarioPanel`, `CodeEditor` (loading của `dynamic()` tách thành `EditorLoading` component để gọi hook), `SuiteTree`.
- [x] `components/ShopAnalyticsChart.tsx` — dead code, chuỗi "Tổng" → `admin.analytics.chartTotal`.
- [x] `settings/shipping/page.tsx` — section "Địa chỉ kho hàng" + heading "Phương thức vận chuyển" (16 key thêm vào `admin.shipping.*`).

**Ranh giới cố ý GIỮ VN (N/A, không phải sót):** root metadata `layout.tsx` + `manifest.ts` (meta tag, default locale vi, noindex — không phải body content); "0đ" (đơn vị tiền VND); default data nghiệp vụ (`useBillingShipping`/`useShippingSettings` shipping method `name`/`note` — dữ liệu shop, không phải UI chrome); `lib/upload-minio.ts` throw fallback (util non-React, lỗi invariant hiếm); `useAdminActions` throw (tiếng Anh, dev nội bộ).

---

## 3. STOREFRONT — phase kế tiếp (ask gốc)

App `apps/storefront` (buyer-facing, **CÓ index SEO** — khác admin noindex → i18n ở đây ẢNH HƯỞNG SEO thật). Namespaces sẵn có: `shop`, `order`, `common`, `auth`, `validation`, `errors` (xem `packages/i18n/src/config.ts`). Storefront buyer strings nên dùng namespace **`shop`/`order`/`common`** (KHÔNG phải `admin`).

Việc cần làm khi bắt đầu storefront:
1. Grep `apps/storefront/src` tìm chuỗi hardcode (JSX text, placeholder, aria-label, toast). Nhiều section page-builder ở `@ecommerce/ui-registry` cũng có chuỗi.
2. Xác định locale storefront lấy từ đâu (cookie `NEXT_LOCALE`? path? shop setting?) — kiểm tra `apps/storefront` root layout + có `I18nProvider` chưa.
3. Convert theo đúng PATTERN mục 1 nhưng namespace `shop`/`order`/`common`; thêm key vào `locales/{en,vi}/shop.json|order.json|common.json`.
4. Vì storefront index được → thêm per-page `generateMetadata` (title/description) + đảm bảo `<html lang>` khớp — QUAN TRỌNG cho SEO (không như admin).
5. Chú ý: `@ecommerce/ui-registry` blocks (heading.tsx, product cards...) shared giữa builder+storefront — đổi chuỗi ở đó ảnh hưởng cả hai.

---

## 4. Verify sau mỗi batch
```bash
# JSON hợp lệ + key đối xứng
node -e "JSON.parse(require('fs').readFileSync('packages/i18n/locales/en/admin.json','utf8'));JSON.parse(require('fs').readFileSync('packages/i18n/locales/vi/admin.json','utf8'));console.log('ok')"
cd apps/admin && npx tsc --noEmit -p tsconfig.json     # phải exit 0
npm run dev   # rồi curl trang vừa đổi, toggle locale:
# curl -s localhost:3001/<path> | grep '<html lang'         → vi + chữ Việt
# curl -s -H "Cookie: NEXT_LOCALE=en" localhost:3001/<path>  → en + chữ Anh
# KHÔNG được thấy raw key kiểu "products.title"
```
Cuối cùng: `cd apps/admin && npx next build` (exit 0) trước khi commit.

**Chưa commit gì** — mọi thay đổi đang ở working tree.
