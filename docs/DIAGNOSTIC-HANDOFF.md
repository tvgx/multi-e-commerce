# Diagnostic Handoff — Lỗi tiềm ẩn & tính năng chưa hoàn thiện

> Tạo 2026-06-18, cập nhật 2026-06-19. Liệt kê theo từng module các lỗi "im lặng cho tới khi
> kích hoạt" và tính năng dang dở, kèm **trigger**, **root cause**, **vị trí**, **hướng sửa**.
> Mỗi mục có ID để chọn sửa độc lập. Mức độ: 🔴 nghiêm trọng (tiền/kho/bảo mật) ·
> 🟠 lỗi chức năng · 🟡 chất lượng/độ bền · 🔵 tính năng chưa làm xong.
>
> **Các mục đã sửa được GỠ khỏi tài liệu này** (chi tiết cũ xem git history) — doc chỉ còn việc
> CHƯA làm. Mục "Đã xong" bên dưới chỉ giữ changelog một dòng.

## Đã xong (changelog — chi tiết đã gỡ)

- **2026-06-18:** `ORD-1` 🔴 admin huỷ đơn hoàn kho + ví · `ORD-2` 🟠 `refundOrder` hoàn kho (trừ
  khi đã delivered/completed/returned) · `PAY-1` 🔴 từ chối thanh toán hoàn kho · `PAY-2` 🔴
  payment-timeout đã enqueue (BankTransfer 15') + processor hoàn kho · `INV-1` 🟠 `restoreStock`
  idempotent + bỏ phụ thuộc tenant · `CAT-2` 🟡 test catalog stale (`tsc` exit 0).
- **2026-06-19:** `SHIP-1` 🟡 shipment `returned`/`canceled` nay hoàn kho + hoàn ví qua `voidOrder`
  → **đóng hoàn toàn chủ đề xuyên suốt #1** · `AUTH-1` 🔴 đổi mật khẩu admin: FE thêm
  `credentials:'include'` + BE truyền `fromNodeHeaders(req.headers)` vào `ownerAuth.api.changePassword`.
- **2026-06-19:** `PROMO-1` 🟠 sửa/tạo khuyến mãi nay lưu đủ trường. Phạm vi rộng hơn doc cũ:
  BE `update` map đủ `discountType/discountValue/startsAt/expiresAt/usageLimit` (chỉ ghi field gửi)
  **+** sửa lệch hợp đồng FE↔BE: FE gửi `type/value/startDate/minOrderValue` (không khớp DB) và
  **thiếu `name`** (NOT NULL) nên create luôn hỏng — FE nay gửi đúng `name/discountType` (lowercase
  `percentage|fixed` khớp `order.createOrder`)/`discountValue`, bỏ field `minOrderValue` không có cột.

**Chủ đề xuyên suốt #1 (ĐÃ ĐÓNG):** logic hoàn kho + hoàn ví đã gom vào
[`OrderService.voidOrder(tx, order, {restock,refund,failPayments,createdBy})`](../apps/api-core/src/modules/order/order.service.ts)
(public, dùng `order.shopId` nên Bull worker không tenant context vẫn gọi được). Mọi đường huỷ đã
nối: `cancelOrder`, `updateOrderStatus(canceled)`, `refundOrder`, `PaymentService.confirmPayment(reject)`,
`PaymentProcessor` timeout, `ShippingService.updateShipment(returned/canceled)`.

Hạ tầng test: stub `test/stubs/uuid.js` + map `^uuid$` (uuid v14 ESM-only phá mọi suite import `bull`).
Toàn suite xanh: **30 suite / 353 test**; `tsc --noEmit` exit 0. Wiring một chiều, không circular:
PaymentModule → OrderModule, ShippingModule → OrderModule.

## Bảng ưu tiên việc còn lại (đọc trước)

| ID | Mức | Một dòng | Module |
|----|-----|----------|--------|
| THEME-1 | 🔴 | Import Figma đồng bộ, không timeout → treo/đứt với file nhiều frame | theme-market |
| PROMO-2 | 🟠 | Race khi đếm lượt dùng mã (đọc promo ngoài transaction) | promotions |
| THEME-2 | 🟠 | `GET /api/themes/:id` public lộ theme draft/pending + ownerUserId | theme-market |
| THEME-3 | 🟠 | INTERNAL_API_KEY lệch giữa 2 app → mọi import 401 câm | theme-market |
| REV-1 | 🟠 | Mất quyền review khi đơn `delivered`→`completed`; không chặn review trùng | interactions |

**Đề xuất kế tiếp:** `PROMO-2` (gọn, cùng module, chống bán-lố lượt mã — kiểm-tra-và-tăng nguyên tử) → `THEME-1`.

---

## Module: order  ([order.service.ts](../apps/api-core/src/modules/order/order.service.ts))

### ORD-3 🟡 `refundOrder`/`updateOrderStatus` bỏ qua state machine khi huỷ  — `[ ]`
- `refundOrder` ép `state:'canceled'` bất kể state hiện tại (kể cả `completed`). Không validate
  transition. Cân nhắc chặn refund đơn `completed`/đã `refunded` (đã chặn `refunded`).

### ORD-4 🟡 `sortBy` truyền thẳng vào Prisma `orderBy`  — `[ ]`
- [findAllOrders](../apps/api-core/src/modules/order/order.service.ts#L304) `orderBy:{[sortBy]:...}`.
  `sortBy` từ query không allowlist → cột sai gây 500 (không phải injection nhưng vỡ runtime).
  Sửa: whitelist `['createdAt','totalAmount','number']`.

### ORD-5 🟡 Checkout cho phép mua sản phẩm DRAFT/ARCHIVED  — `[ ]`
- [createOrder](../apps/api-core/src/modules/order/order.service.ts#L48) load variant theo id, không
  lọc `product.status`. Khách có thể đặt biến thể của sản phẩm nháp/đã ẩn (qua API trực tiếp).
  Sửa: thêm điều kiện `product.status === 'ACTIVE'` khi load variant.

---

## Module: payment  ([payment.service.ts](../apps/api-core/src/modules/payment/payment.service.ts))

### PAY-3 🔵 Cổng thanh toán thật chưa tích hợp  — `[ ]`
- `createPaymentUrl` trả URL sandbox giả; `handleWebhook` chỉ `return {status:'success'}` không cập
  nhật đơn. VNPAY/Momo/Stripe chưa nối. Hiện chỉ có Wallet + BankTransfer (confirm thủ công) hoạt động.

---

## Module: inventory  ([inventory.service.ts](../apps/api-core/src/modules/inventory/inventory.service.ts))

### INV-2 🟡 Trừ kho chỉ ở 1 location mặc định  — `[ ]`
- [decrementStock](../apps/api-core/src/modules/inventory/inventory.service.ts#L41) chọn 1 stockItem
  (ưu tiên default). Nếu default hết nhưng location khác còn → vẫn báo hết hàng. Multi-location chưa
  cộng gộp. Chấp nhận được nếu mỗi shop 1 kho; ghi nhận để mở rộng sau.

---

## Module: promotions  ([promotions.service.ts](../apps/api-core/src/modules/promotions/promotions.service.ts))

### PROMO-2 🟠 Race khi đếm lượt dùng mã  — `[ ]`
- **Trigger:** Nhiều đơn dùng lượt cuối của mã đồng thời.
- **Root cause:** Trong `order.createOrder`, promo được đọc **ngoài** transaction
  ([order.service.ts:94](../apps/api-core/src/modules/order/order.service.ts#L94)) rồi mới
  `increment usedCount` trong tx mà không tái kiểm tra `usedCount < usageLimit` ở mức DB.
- **Hướng sửa:** Dùng `updateMany({where:{id, usedCount:{lt:usageLimit}}, data:{usedCount:{increment:1}}})`
  và nếu `count===0` thì throw — kiểm-tra-và-tăng nguyên tử.

---

## Module: theme-market + design-agent (luồng theme/Figma — mới, untracked)

Đã rà sâu ở pha trước. Files: [theme-market.service.ts](../apps/api-core/src/modules/theme-market/theme-market.service.ts),
[theme-market.controller.ts](../apps/api-core/src/modules/theme-market/theme-market.controller.ts),
[extractor.service.ts](../apps/design-agent/src/extractor/extractor.service.ts),
[theme-converter.ts](../packages/schema/src/theme-converter.ts).

### THEME-1 🔴 Import Figma đồng bộ, không timeout  — `[ ]`
- **Trigger:** Import file Figma thật nhiều frame qua trang "Theme của tôi".
- **Root cause:** Browser → admin → [importFromFigma fetch](../apps/api-core/src/modules/theme-market/theme-market.service.ts#L301)
  (không timeout) → design-agent chạy tuần tự: tải file + mỗi frame gọi Claude + rehost ảnh MinIO.
  Mất nhiều phút, UI chỉ có spinner; proxy/undici có thể cắt → "Import thất bại" mơ hồ, theme có thể
  đã ghi một phần.
- **Hướng sửa:** Chuyển sang job nền (tái dùng Bull `shop-build` pattern / hạ tầng worker có sẵn).
  API trả `jobId`, admin poll tiến độ (giống `?finalizing=true` của build). Tối thiểu: đặt
  `AbortSignal.timeout()` + thông báo "có thể mất vài phút".

### THEME-2 🟠 `GET /api/themes/:id` public lộ theme chưa publish  — `[ ]`
- **Root cause:** [getTheme](../apps/api-core/src/modules/theme-market/theme-market.controller.ts#L59)
  gắn `@Public()` và trả full document mọi status (gồm `ownerUserId`, toàn bộ cây trang). `themeId`
  = `slug-<6 ký tự>` đoán được.
- **Hướng sửa:** Trong service `getTheme`, nếu `status !== 'published'` thì yêu cầu owner/admin
  (đã có `getOwnedThemeOrThrow`/`isAdmin`). Public chỉ trả theme published.

### THEME-3 🟠 Import phụ thuộc `INTERNAL_API_KEY` khớp ở cả 2 app → 401 câm  — `[ ]`
- [extractor.controller.ts:44](../apps/design-agent/src/extractor/extractor.controller.ts#L44):
  `if(!expected || internalKey!==expected) → 401`. Lệch/thiếu env ở design-agent → mọi import 401.
  `.env` hiện đã có giá trị thật (dev OK) nhưng là bẫy khi deploy.
- **Hướng sửa:** Validate env fail-fast lúc bootstrap cả 2 app; ghi rõ trong README key phải đồng nhất.

### THEME-4 🟡 `applyTheme` không dọn trang cũ  — `[ ]`
- [applyTheme](../apps/api-core/src/modules/theme-market/theme-market.service.ts#L364) chỉ upsert các
  pageType có trong theme; trang cũ của shop không nằm trong theme vẫn còn → giao diện "lai".
  Quyết định sản phẩm: additive (giữ) hay thay thế (xoá page không thuộc theme).

---

## Module: auth  ([auth.service.ts](../apps/api-core/src/modules/auth/auth.service.ts))

### AUTH-2 🟡 Endpoint auth custom không set cookie  — `[ ]`
- `auth.service.login/register` gọi better-auth không `asResponse` → token trả trong body, **không**
  set Set-Cookie. Nếu có client nào dựa vào các endpoint này để có session cookie sẽ thất bại lặng lẽ.
  Khuyến nghị: xoá/đánh dấu deprecated để tránh dùng nhầm.

---

## Module: interactions (reviews/wishlist)  ([interactions.service.ts](../apps/api-core/src/modules/interactions/interactions.service.ts))

### REV-1 🟠 Mất quyền review khi đơn `completed` + không chặn review trùng  — `[ ]`
- **Root cause:** [createReview](../apps/api-core/src/modules/interactions/interactions.service.ts#L106)
  yêu cầu `order.state === 'delivered'`. Khi admin chuyển đơn `delivered`→`completed`, khách
  **không còn review được**. Ngoài ra không kiểm tra đã review sản phẩm này chưa → tạo review trùng
  không giới hạn.
- **Hướng sửa:** Đổi điều kiện thành `state: { in: ['delivered','completed'] }`. Thêm guard duy nhất
  (kiểm tra đã có ProductReview của (customerId, productId) chưa) hoặc unique index.

### REV-2 🟡 Không cập nhật rating trung bình của sản phẩm  — `[ ]`
- create/update/deleteReview không tính lại điểm trung bình/đếm review trên Product. Nếu UI hiển thị
  rating, phải tính lúc đọc (kiểm tra catalog read). Cân nhắc cache trường `avgRating/reviewCount`.

---

## Module: layout/build  ([layout.service.ts](../apps/api-core/src/modules/layout/layout.service.ts), [build.service.ts](../apps/api-core/src/modules/build/build.service.ts))

### LAY-1 🔵 `createMasterTemplate` là no-op  — `[ ]`
- [layout.service.ts:98](../apps/api-core/src/modules/layout/layout.service.ts#L98) trả
  `{status:'created'}` mà không tạo gì (placeholder). Nếu UI admin có nút "tạo master template" thì
  bấm xong không có gì xảy ra.

### BUILD-1 🟡 Job build kẹt `RUNNING` nếu worker crash  — `[ ]`
- [enqueueBuild](../apps/api-core/src/modules/build/build.service.ts#L31) dedupe theo
  `status in (QUEUED,RUNNING)`. Worker crash không cập nhật status → mọi build sau trả lại job kẹt →
  shop không build lại được. Sửa: coi job `RUNNING` quá N phút là stale (cho enqueue mới) hoặc
  heartbeat `updatedAt`.

### LAY-2 🟡 URL storefront dạng subdomain cần wildcard DNS  — `[ ]`
- [buildStorefrontUrl](../apps/api-core/src/modules/layout/layout.service.ts#L368) tạo
  `<identifier>.<host>`. Trên `localhost:3002` subdomain không phân giải nếu không cấu hình. Liên quan
  cloudflare tunnel khi deploy. Không phải lỗi code, ghi nhận cho môi trường.

---

## Module: shipping  ([shipping.service.ts](../apps/api-core/src/modules/shipping/shipping.service.ts))

- ✅ SHIP-1 đã sửa (xem changelog). Không còn finding tồn đọng ở module này.

---

## Module: cart  ([cart.service.ts](../apps/api-core/src/modules/cart/cart.service.ts))

- ✅ Sạch, phòng thủ tốt (validate tay vì không có global ValidationPipe, dùng giá live).
- 🟡 CART-1: `addItem` không chặn variant của sản phẩm DRAFT/ARCHIVED (liên quan ORD-5).

## Module: wallet  ([wallet.service.ts](../apps/api-core/src/modules/wallet/wallet.service.ts))

- ✅ Tốt: debit kiểm số dư nguyên tử (`updateMany ... balance>=amount`), token topup không lộ ra
  client, validate NaN/Infinity, resolveTopup chống double-confirm.

## Module: customer-address  ([customer-address.service.ts](../apps/api-core/src/modules/customer-address/customer-address.service.ts))

- ✅ Tốt: quản lý isDefault trong transaction, re-assign default khi xoá.
- 🟡 ADDR-1: `update` truyền `isDefault: dto.isDefault` có thể là `false` cho địa chỉ default duy nhất
  → shop có thể còn 0 default. Minor.

## Module: catalog  ([catalog.service.ts](../apps/api-core/src/modules/catalog/catalog.service.ts))

- ✅ CAT-2 đã sửa (xem changelog).
- 🟡 CAT-3: nên kiểm tra `updateCollection`/`updateProduct` có rơi trường / lệch hợp đồng FE↔BE
  giống lớp lỗi `PROMO-1` (đã sửa, xem changelog) không — chưa rà kỹ.

## Module: analytics  ([analytics.service.ts](../apps/api-core/src/modules/analytics/analytics.service.ts))

- ✅ Phòng thủ tốt: guard chia 0 khắp nơi, xử lý timezone Asia/Ho_Chi_Minh, check NaN.
- 🔵 ANALY-1: conversion/funnel chỉ có dữ liệu từ 2026-06-13 trở đi (visit tracking mới bật). Không
  phải bug — kỳ vọng dashboard trống cho kỳ trước đó. (Commit `c232de2`: "added, not tested yet".)

## Module: storefront-auth  ([storefront-auth.service.ts](../apps/api-core/src/modules/storefront-auth/storefront-auth.service.ts))

- 🟡 SFAUTH-1: `changePassword` là no-op có chủ đích, trả message chỉ dẫn dùng
  `/api/auth/customer/change-password` (better-auth). Nếu UI storefront gọi endpoint này sẽ "thành
  công giả" mà không đổi mật khẩu. Đảm bảo storefront gọi đúng endpoint better-auth.

## Module: media  ([media.service.ts](../apps/api-core/src/modules/media/media.service.ts))

- 🟡 MEDIA-1: `deleteMedia` xoá DB trước, nếu xoá object MinIO lỗi chỉ log cảnh báo (object rác còn
  lại). Chấp nhận được; cân nhắc job dọn rác. (Routing bucket xem memory `minio-bucket-routing`.)

## Các module còn lại (rà nhanh, chưa thấy lỗi nghiêm trọng)

- chat, notifications, geo, email, templates, option-type: hành vi đơn giản, dùng `{data}` wrapper
  nhất quán với apiClient. Chưa phát hiện lỗi tiềm ẩn đáng kể trong pha này.

---

## Đã xác minh KHÔNG phải bug (loại trừ nghi ngờ)

- 14 controller không dùng `BaseResponseDto`: tự trả `{data, meta}` đúng với `res.data` của apiClient.
- Trùng tên Mongoose model `GlobalLayout`/`PageLayout` (Layout vs ThemeMarket module): cùng schema
  gốc `@ecommerce/database` → không drift.
- Route ordering theme-market controller: literal `mine`/`admin/review` khai báo trước `:themeId`.
- Trùng export `slugify`/`firstImageUrl` trong package schema: chỉ định nghĩa 1 nơi; compile sạch.

## Lệnh kiểm tra nhanh

- Typecheck: `cd apps/api-core && npx tsc -p tsconfig.json --noEmit` (hiện exit 0).
- design-agent: `cd apps/design-agent && npx tsc -p tsconfig.build.json --noEmit` (exit 0).
- Jest: `cd apps/api-core && npx jest` (30 suite / 353 test xanh). Trên WSL cần
  `@unrs/resolver-binding-linux-x64-gnu` (xem memory `wsl-npm-native-bindings`).
