# Module: customer-address

Sổ địa chỉ của khách mua hàng (dùng khi checkout). Controller: [`customer-address.controller.ts`](../../apps/api-core/src/modules/customer-address/customer-address.controller.ts) — base `@Controller('addresses')` → `/api/addresses`. Auth: cả controller dùng `StorefrontAuthGuard`.

---

## `GET /api/addresses`
Danh sách địa chỉ của khách. Không tham số.

## `POST /api/addresses` — `CreateAddressDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `fullName` | ✅ | string | Người nhận |
| `phone` | ✅ | string | |
| `addressLine1` | ✅ | string | Địa chỉ chi tiết |
| `city` | ✅ | string | |
| `province` | ✅ | string | |
| `postalCode` | ❌ | string | |
| `isDefault` | ❌ | boolean | Đặt làm mặc định |

## `PATCH /api/addresses/:id` — `UpdateAddressDto`
Cập nhật (tất cả field optional). `id` (path).

## `POST /api/addresses/:id/default`
Đặt địa chỉ làm mặc định. `id` (path).

## `DELETE /api/addresses/:id`
Xoá địa chỉ. `id` (path).

---

**Lỗi**: `9998`/`401` chưa đăng nhập · `1002` thiếu trường bắt buộc.
