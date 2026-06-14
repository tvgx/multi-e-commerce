# Module: layout

Cấu hình giao diện gian hàng lưu trên **MongoDB** (global header/footer + theme, và từng page). Phục vụ builder (lưu nháp `draftData`) và xuất bản (`draftData → publishedData`, đưa shop từ DRAFT → PUBLISHED). Controller: [`layout.controller.ts`](../../apps/api-core/src/modules/layout/layout.controller.ts) — base `@Controller('layouts')` → `/api/layouts`.

Auth: phần storefront + builder là `@Public()` (builder không khoá chặt cho dev local); một số route admin dùng `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `GET /api/layouts/:shopId/global` — Public
Layout global đã xuất bản (header/footer/theme). `shopId` (path).

## `GET /api/layouts/:shopId/page/:pageType` — Public
Layout 1 trang đã xuất bản. `shopId`, `pageType` (path); `slug` (query, tùy chọn — cho trang động như collection/page).

## `GET /api/layouts/builder/schemas` — Public
Schema các component dùng trong builder. Không tham số.

## `GET /api/layouts/:shopId/draft/global` — Public
Bản nháp global của builder. `shopId` (path).

## `GET /api/layouts/:shopId/draft/page/:pageType` — Public
Bản nháp 1 trang. `shopId`, `pageType` (path).

## `POST /api/layouts/builder/save/global` — Public
Lưu nháp global (header/footer + theme).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `shopId` | ✅ | string | |
| `globalComponents` | ❌ | array | Danh sách component global |
| `theme` | ❌ | object | Token theme (màu, font...) |

## `POST /api/layouts/builder/save/page` — Public
Lưu nháp 1 trang.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `shopId` | ✅ | string | |
| `pageType` | ✅ | string | `home`, `product`, `collection`... |
| `components` | ❌ | array | Danh sách component của trang |

## `POST /api/layouts/:shopId/publish` — Public
Xuất bản toàn bộ layout (`draftData → publishedData`, shop → PUBLISHED). `shopId` (path).

## `POST /api/layouts/:shopId/publish/page/:pageType` — Public
Xuất bản 1 trang (wizard thiết kế từng bước). `shopId`, `pageType` (path).

## `POST /api/layouts/:shopId/seed` — Public
Seed trang mặc định cho shop mới (header/footer + Home/listing/detail). `shopId` (path).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `shopName` | ❌ | string | Tên shop để chèn vào layout mẫu |

## `POST /api/layouts/master` — (mock admin)
Tạo master template theo ngành.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `industry` | ✅ | string | Ngành hàng |
| `schema` | ✅ | object | Schema layout |

## `GET /api/layouts/tenant` — Public
Layout theo tenant hiện tại (gọi từ storefront Next.js).

## `PATCH /api/layouts/tenant` — Auth
Ghi đè layout tenant.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `overrides` | ✅ | object | Phần ghi đè cấu hình |

## `POST /api/layouts/publish` — Auth
Xuất bản layout theo tenant context. Không tham số.

---

Mọi response bọc envelope `{ code, message, data }`. **Lỗi thường gặp**: `1002` thiếu `shopId` · `9992`/`404` shop không tồn tại · `1009` không đủ quyền (route admin).

> Liên quan: xuất bản chạy nền qua Bull queue `shop-build` — xem [build](../build/) và [shop](../shop/).
