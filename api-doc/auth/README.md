# Module: auth

Xác thực **người bán** (admin) qua better-auth: đăng ký (kèm tạo shop), đăng nhập, hồ sơ, đổi mật khẩu/username, quên/đặt lại mật khẩu. Controller: [`auth.controller.ts`](../../apps/api-core/src/modules/auth/auth.controller.ts) — base `@Controller('auth')` → `/api/auth`. Mặc định cả controller dùng `BetterAuthGuard`; route công khai gắn `@Public()`.

---

## `POST /api/auth/register` — Public, `RegisterDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `email` | ✅ | email | |
| `password` | ✅ | string ≥ 6 | |
| `name` | ✅ | string | Tên người dùng |
| `shopName` | ✅ | string | Tên gian hàng tạo kèm |

## `POST /api/auth/login` — Public, `LoginDto`
`email`✅(email), `password`✅(string).

## `POST /api/auth/forgot-password` — Public
Body: `{ "email": string }`.

## `POST /api/auth/reset-password` — Public
Body: `{ "token": string, "newPassword": string }`.

## `GET /api/auth/me` — Auth
Thông tin người dùng hiện tại.

## `GET /api/auth/verify-session` — Auth
Kiểm tra phiên hợp lệ.

## `GET /api/auth/health` — Public
Healthcheck.

## `PUT /api/auth/profile` — Auth, `UpdateUserProfileDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `fullName` | ❌ | string | |
| `identityNumber` | ❌ | string | CCCD/CMND |
| `dateOfBirth` | ❌ | ISO date | vd `1990-01-01` |
| `gender` | ❌ | string | `MALE`/`FEMALE`/`OTHER` |

## `PUT /api/auth/change-username` — Auth
Body: `{ "newName": string }`. Ràng buộc: cách 30 ngày, không trùng người khác.

## `POST /api/auth/change-password` — Auth, `ChangePasswordDto`
`oldPassword`✅, `newPassword`✅(≥6).

## `POST /api/auth/logout` — Auth
Đăng xuất.

---

**Lỗi**: `9996` user đã tồn tại · `9993` sai mật khẩu · `9998` token không hợp lệ · `9995` chưa xác thực · `1017` đổi username chưa đủ 30 ngày · `1018` username trùng.
