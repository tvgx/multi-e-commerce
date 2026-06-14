# Module: cart

Giỏ hàng của người mua tại storefront. Mỗi khách (đăng nhập storefront) có 1 giỏ; thao tác theo `variantId`. Controller: [`cart.controller.ts`](../../apps/api-core/src/modules/cart/cart.controller.ts) — base `@Controller('cart')` → `/api/cart`.

Auth: **toàn bộ** route dùng `StorefrontAuthGuard` (cần phiên khách mua). `customerId` lấy từ `req.user.id`.

---

## `GET /api/cart`
Lấy giỏ hàng hiện tại. Không tham số.

**Response** `data`: `{ items: CartItem[], subtotal, ... }`.

## `POST /api/cart/items` — `AddCartItemDto`
Thêm sản phẩm vào giỏ.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `variantId` | ✅ | string | Biến thể/SKU cần thêm |
| `quantity` | ✅ | int ≥ 1 | Số lượng |

```json
{ "variantId": "var_123", "quantity": 2 }
```

## `PATCH /api/cart/items/:itemId` — `UpdateCartItemDto`
Cập nhật số lượng 1 dòng. `itemId` (path).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `quantity` | ✅ | int ≥ 0 | `0` = xoá dòng khỏi giỏ |

## `DELETE /api/cart/items/:itemId`
Xoá 1 dòng khỏi giỏ. `itemId` (path).

## `DELETE /api/cart`
Xoá sạch giỏ hàng. Không tham số.

---

**Response** đều bọc envelope `{ code, message, data }`. **Lỗi thường gặp**: `9998`/`401` chưa đăng nhập storefront · `9992` biến thể không tồn tại · `1011` sản phẩm đã hết · `1002` thiếu tham số.
