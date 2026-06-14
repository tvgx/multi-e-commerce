# Module: storefront-auth

Xác thực **người mua** tại storefront (tách biệt với auth người bán). Controller: [`storefront-auth.controller.ts`](../../apps/api-core/src/modules/storefront-auth/storefront-auth.controller.ts) — base `@Controller('storefront-auth')` → `/api/storefront-auth`. Phiên truyền qua header `Authorization`.

---

## `POST /api/storefront-auth/register` — `StoreRegisterDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `email` | ✅ | email | |
| `password` | ✅ | string ≥ 6 | |
| `fullName` | ✅ | string | |

## `POST /api/storefront-auth/login` — `StoreLoginDto`
`email`✅(email), `password`✅(string). **Response** `data`: `{ token, customer }`.

## `GET /api/storefront-auth/me`
Thông tin khách hiện tại. Header `Authorization: Bearer <token>` (bắt buộc).

## `POST /api/storefront-auth/change-password`
Header `Authorization` (bắt buộc). Body: thông tin đổi mật khẩu.

## `POST /api/storefront-auth/forgot-password`
Body: `{ "email": string, "shopId": string, "shopSlug": string }`.

## `POST /api/storefront-auth/reset-password`
Body: `{ "token": string, "password": string }`.

---

**Lỗi**: `9996` đã tồn tại · `9993` sai mật khẩu · `9998` token không hợp lệ · `1002` thiếu tham số.
