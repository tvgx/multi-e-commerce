# Module: promotions

Mã giảm giá / khuyến mãi: CRUD phía shop + kiểm tra hợp lệ khi checkout. Controller: [`promotions.controller.ts`](../../apps/api-core/src/modules/promotions/promotions.controller.ts) — base `@Controller('promotions')` → `/api/promotions`. Auth: CRUD yêu cầu role `ADMIN`/`OWNER`; `validate` là `@Public()`.

---

## `GET /api/promotions` — Auth
Danh sách khuyến mãi của shop.

## `GET /api/promotions/:id` — Auth
Chi tiết. `id` (path).

## `POST /api/promotions` — Auth, `CreatePromotionDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ✅ | string | |
| `code` | ❌ | string | Mã nhập khi checkout |
| `description` | ❌ | string | |
| `discountType` | ✅ | `percentage`\|`fixed` | Loại giảm |
| `discountValue` | ✅ | number ≥ 0 | Giá trị giảm |
| `startsAt` | ❌ | ISO date | |
| `expiresAt` | ❌ | ISO date | |
| `usageLimit` | ❌ | number ≥ 1 | Giới hạn lượt dùng |
| `isActive` | ❌ | boolean | |

## `PATCH /api/promotions/:id` — Auth, `UpdatePromotionDto`
`name?`, `description?`, `isActive?`. `id` (path).

## `DELETE /api/promotions/:id` — Auth
Xoá. `id` (path).

## `POST /api/promotions/validate` — Public, `ValidatePromotionDto`
Kiểm tra mã hợp lệ với giá trị đơn.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `code` | ✅ | string | Mã KM |
| `orderSubtotal` | ✅ | number | Tạm tính đơn |

**Response** `data`: `{ valid, discountAmount, ... }`.

---

**Lỗi**: `1014` mã hết hạn · `1004` mã không hợp lệ · `1009` không đủ quyền.
