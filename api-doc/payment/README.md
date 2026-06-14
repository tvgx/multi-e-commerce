# Module: payment

Thanh toán đơn hàng: tạo URL thanh toán, nhận webhook cổng thanh toán, xác nhận giao dịch theo token, tra trạng thái. Xử lý nền qua Bull `payment` ([`payment.processor.ts`](../../apps/api-core/src/modules/payment/payment.processor.ts)). Controller: [`payment.controller.ts`](../../apps/api-core/src/modules/payment/payment.controller.ts) — base `@Controller('payments')` → `/api/payments`.

Auth: route cổng/khách là `@Public()`; route còn lại theo phiên hiện tại.

---

## `POST /api/payments/create-url` — `CreatePaymentDto`
Tạo URL thanh toán cho đơn.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `orderId` | ✅ | string | Đơn cần thanh toán |
| `paymentMethod` | ✅ | string | Mã phương thức |
| `amount` | ✅ | number | Số tiền |

**Response** `data`: `{ paymentUrl, token, ... }`.

## `GET /api/payments/methods` — Public
Phương thức thanh toán khả dụng của shop. Header `x-shop-id` (bắt buộc).

## `POST /api/payments/webhook` — Public, `PaymentWebhookDto`
Cổng thanh toán gọi về. Header `x-shop-id` (bắt buộc).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `transactionId` | ✅ | string | Mã giao dịch cổng |
| `status` | ✅ | string | Trạng thái giao dịch |
| `signature` | ❌ | string | Chữ ký xác thực |

## `POST /api/payments/confirm` — Public
Xác nhận/từ chối thanh toán theo token (trang xác nhận chuyển khoản).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `token` | ✅ | string | Token phiên thanh toán |
| `action` | ✅ | `confirm`\|`reject` | Hành động |

## `GET /api/payments/status/:orderId`
Trạng thái thanh toán của đơn. `orderId` (path).

## `GET /api/payments/token-info/:token` — Public
Thông tin phiên thanh toán theo token (hiển thị cho trang confirm). `token` (path).

---

**Lỗi thường gặp**: `1015` không xử lý được thẻ/thanh toán · `1002` thiếu tham số · `9998` token không hợp lệ · `1010` giao dịch đã xử lý trước đó.
