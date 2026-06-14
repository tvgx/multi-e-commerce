# Module: wallet

Ví khách hàng: xem số dư & giao dịch, yêu cầu nạp tiền (topup); phía admin: quản lý ví, duyệt topup, điều chỉnh số dư, bật/tắt thanh toán bằng ví. Controller: [`wallet.controller.ts`](../../apps/api-core/src/modules/wallet/wallet.controller.ts) — base `@Controller('wallet')` → `/api/wallet`. Auth: route `me/*` & `topup` dùng `StorefrontAuthGuard`; route `admin/*` dùng `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## Khách

### `GET /api/wallet/me`
Số dư ví của khách. Không tham số.

### `GET /api/wallet/me/transactions`
Lịch sử giao dịch. `page?`, `limit?` (query).

### `POST /api/wallet/topup` — `TopupRequestDto`
Yêu cầu nạp tiền.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `amount` | ✅ | number ≥ 1000 | Số tiền nạp |

## Admin

### `GET /api/wallet/admin/wallets` — query `{ search?, page?, limit? }`
Danh sách ví khách.

### `GET /api/wallet/admin/wallets/:id/transactions`
Giao dịch của 1 ví. `id` (path); `page?`,`limit?` (query).

### `POST /api/wallet/admin/adjust` — `AdjustWalletDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `customerId` | ✅ | string | |
| `amount` | ✅ | number | Dương = cộng, âm = trừ |
| `note` | ❌ | string | |

### `GET /api/wallet/admin/topups?status=`
Danh sách yêu cầu nạp tiền (lọc theo `status`).

### `POST /api/wallet/admin/topups/:id/resolve` — `ResolveTopupDto`
Duyệt/từ chối topup. `id` (path). `action`✅ ∈ `confirm`|`reject`.

### `GET /api/wallet/admin/payment-method`
Trạng thái bật/tắt thanh toán bằng ví.

### `POST /api/wallet/admin/payment-method` — `ToggleWalletPaymentDto`
Bật/tắt. Body: `active` (boolean).

---

**Lỗi**: `9998`/`401` chưa xác thực · `1009` không đủ quyền · `1004` số tiền không hợp lệ · `1015` không xử lý được thanh toán.
