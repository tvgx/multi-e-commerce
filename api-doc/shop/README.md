# Module: shop

Tạo & quản lý gian hàng (tenant), onboarding của người bán, tài khoản ngân hàng, kho mặc định, bật/tắt phương thức thanh toán. Controller: [`shop.controller.ts`](../../apps/api-core/src/modules/shop/shop.controller.ts) — base `@Controller('shops')` → `/api/shops`.

Auth: route `@Public()` cho storefront; còn lại yêu cầu `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `GET /api/shops/resolve/:identifier` — Public
Phân giải domain/slug → thông tin shop. `identifier` (path, bắt buộc, string).

**Response** `data`: object shop (id, name, domain, status...).

## `GET /api/shops/bootstrap/:identifier` — Public
Dữ liệu khởi tạo storefront (shop + cấu hình cơ bản). `identifier` (path, bắt buộc, string).

## `GET /api/shops/my-shops` — Auth
Danh sách shop thuộc người dùng đăng nhập. Không tham số.

**Response** `data`: `Shop[]` (kèm `bankAccount`).

## `POST /api/shops` — Auth
Tạo gian hàng mới.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ✅ | string | Tên gian hàng |
| `domain` | ❌ | string | Tên miền/slug |
| `currency` | ❌ | string | Mặc định `VND` |
| `templateType` | ❌ | string | Loại mẫu khởi tạo |

```json
{ "name": "My Shop", "domain": "my-shop", "currency": "VND", "templateType": "fashion" }
```

**Response** `{ "code": "1000", "message": "OK", "data": { "id": "...", "name": "My Shop", "domain": "my-shop", "currency": "VND", "ownerId": "...", "status": "DRAFT" } }`

## `GET /api/shops/current` — Auth
Shop theo tenant context hiện tại. Không tham số.

## `PATCH /api/shops/current` — Auth
Cập nhật shop hiện tại. Body = `UpdateShopDto`.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ❌ | string | |
| `domain` | ❌ | string | |
| `currency` | ❌ | string | |
| `productsPerPage` | ❌ | int ≥ 1 | Số SP mỗi trang storefront |

## `PATCH /api/shops/bank-account` — Auth
Cập nhật tài khoản ngân hàng nhận tiền.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `bankName` | ✅ | string | Tên ngân hàng |
| `accountNumber` | ✅ | string | Số tài khoản |
| `accountHolder` | ✅ | string | Chủ tài khoản |

## `GET /api/shops/:shopId/onboarding` — Auth
Tiến trình onboarding của shop. `shopId` (path, bắt buộc).

**Response** `data`: tiến trình các bước (step1..stepN, completed flags).

## `PATCH /api/shops/:shopId/onboarding/complete/:step` — Auth
Đánh dấu hoàn thành 1 bước onboarding. `shopId`, `step` (path, bắt buộc; `step` số nguyên).

## `PATCH /api/shops/:shopId/warehouse` — Auth
Địa chỉ kho lấy hàng mặc định (trang Billing & Shipping). `shopId` (path). Body = `UpdateWarehouseDto`:

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ❌ | string | Tên người liên hệ |
| `phone` | ❌ | string | |
| `addressLine` | ❌ | string | |
| `provinceCode` | ❌ | string | Mã tỉnh (geo) |
| `wardCode` | ❌ | string | Mã phường/xã (geo) |
| `note` | ❌ | string | |

## `PATCH /api/shops/:shopId/payment-methods` — Auth
Bật/tắt phương thức thanh toán cơ bản. `shopId` (path).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `cod` | ❌ | boolean | Thanh toán khi nhận hàng |
| `bankTransfer` | ❌ | boolean | Chuyển khoản |

## `GET /api/shops/:shopId` — Public
Chi tiết shop theo id. `shopId` (path, bắt buộc).

## `PATCH /api/shops/:shopId` — Auth
Cập nhật shop theo id. `shopId` (path). Body = `UpdateShopDto` (như `/current`).

---

**Lỗi thường gặp**: `1002` thiếu tham số · `1009` không đủ quyền · `9998` token không hợp lệ · `1013` domain/định danh đã tồn tại.
