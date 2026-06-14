# storefront — Gian hàng người mua

**Stack**: Next.js (App Router, Server Components), Tailwind. Dev cổng **3002** (`npm run dev`).

"Zero-File Engine": KHÔNG build code riêng cho từng shop. Người bán dựng layout trong admin builder → lưu JSON (MongoDB) → storefront **render động** từ JSON. 1 codebase phục vụ mọi shop. Component resolver ánh xạ `componentType` trong JSON → React component (registry ở `@ecommerce/ui-registry`).

## Luồng & tính năng

Truy cập theo `[shopSlug]` → resolve tenant → fetch layout đã publish → render. Trang người mua trong `src/app/[shopSlug]/(buyer-view)/*`:

| Tính năng | Trang | API (xem [api-doc](../../../api-doc/)) |
|-----------|-------|-----------------------------------------|
| Duyệt / tìm sản phẩm | `all-products`, `products/[id]`, `collections/[slug]` | [catalog](../../../api-doc/catalog/) |
| Giỏ hàng | `cart` | [cart](../../../api-doc/cart/) |
| Thanh toán | `payment`, `/payment/confirm/[token]` | [order](../../../api-doc/order/), [payment](../../../api-doc/payment/), [shipping](../../../api-doc/shipping/) |
| Tài khoản người mua | `account/*`, `profile` | [storefront-auth](../../../api-doc/storefront-auth/), [customer-address](../../../api-doc/customer-address/) |
| Wishlist / Ví | `wishlist`, `wallet` | [interactions](../../../api-doc/interactions/), [wallet](../../../api-doc/wallet/) |

Layout lấy qua [layout](../../../api-doc/layout/) (`GET /api/layouts/:shopId/global|page/:pageType`). Đa ngôn ngữ qua `@ecommerce/i18n`. Lint `npm run lint`.
