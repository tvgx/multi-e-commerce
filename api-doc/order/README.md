# Module: order

Đặt hàng (checkout) từ phía người mua và quản lý/xử lý đơn từ phía người bán. Controller: [`order.controller.ts`](../../apps/api-core/src/modules/order/order.controller.ts) — base `@Controller('orders')` → `/api/orders`.

Auth: route khách dùng `StorefrontAuthGuard`; route quản trị dùng `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `POST /api/orders/checkout` — Khách, `CheckoutDto`
Tạo đơn từ giỏ hàng. Không truyền `lineItems` ⇒ checkout toàn bộ giỏ server-side.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `paymentMethodId` | ✅ | string | Phương thức thanh toán |
| `lineItems` | ❌ | array | Mỗi phần tử: `variantId`✅(string), `quantity`✅(number). Bỏ trống = lấy cả giỏ |
| `promotionCode` | ❌ | string | Mã giảm giá |
| `shippingMethodId` | ❌ | string | Phương thức vận chuyển |
| `shippingAddress` | ❌ | object | Địa chỉ giao inline (xem dưới) |
| `shippingAddressId` | ❌ | string | Dùng địa chỉ đã lưu trong sổ thay cho inline |

`shippingAddress`: `fullName`✅, `phone`✅, `addressLine1`✅, `city`✅, `province`?, `note`? (tất cả string).

```json
{
  "paymentMethodId": "pm_cod",
  "promotionCode": "SALE10",
  "shippingMethodId": "ship_std",
  "shippingAddress": { "fullName": "Nguyễn A", "phone": "09xx", "addressLine1": "1 Đại Cồ Việt", "city": "Hà Nội" }
}
```

**Response** `data`: đơn vừa tạo (id, mã đơn, tổng tiền, trạng thái).

## `GET /api/orders/my` — Khách, query `GetOrdersDto`
Đơn của khách đang đăng nhập.

| Field (query) | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `page`,`limit`,`sortBy`,`sortOrder`,`search` | ❌ | (pagination) | Xem chuẩn phân trang |
| `state` | ❌ | string | Trạng thái đơn |
| `paymentState` | ❌ | string | Trạng thái thanh toán |
| `shipmentState` | ❌ | string | Trạng thái giao hàng |

## `POST /api/orders/:id/cancel` — Khách
Khách tự huỷ đơn của mình. `id` (path).

## `GET /api/orders` — Auth (quản trị), query `GetOrdersDto`
Danh sách tất cả đơn của shop (lọc như trên).

## `GET /api/orders/:id` — Auth
Chi tiết 1 đơn. `id` (path).

## `PATCH /api/orders/:id/status` — Auth, `UpdateOrderStatusDto`
Cập nhật trạng thái đơn. `id` (path).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `status` | ✅ | enum | `confirmed`\|`processing`\|`shipped`\|`delivered`\|`completed`\|`canceled`\|`returned` |

## `POST /api/orders/:id/refund` — Auth
Hoàn tiền đơn. `id` (path).

---

**Lỗi thường gặp**: `9998`/`401` chưa xác thực · `1009` không đủ quyền · `1004` `status` không hợp lệ · `1010` đơn đã ở trạng thái yêu cầu · `1014` mã KM hết hạn · `1012` địa chỉ không hỗ trợ giao.
