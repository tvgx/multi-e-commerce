# ShopVolo v2 — Tác nhân & Use-case

SaaS e-commerce đa tenant, kiến trúc Zero-File (Next.js + NestJS). Endpoint dưới đây là **route thật**; chi tiết request/response xem [api-doc](../api-doc/).

## Tác nhân
| Tác nhân | Vai trò | Quyền |
|----------|---------|-------|
| Super/Platform Admin | Quản lý nền tảng, master template | Toàn nền tảng |
| Tenant Owner (người bán) | Quản lý shop của mình (giao diện, sản phẩm, đơn) | Trong 1 tenant (role `ADMIN`/`OWNER`) |
| End Customer (người mua) | Duyệt, giỏ hàng, checkout | Công khai + phiên khách |
| System/Cron | Xử lý nền (build/publish, email, payment qua Bull) | Tự động |

## 10 Use-case (→ endpoint thật)

| UC | Tác nhân | Endpoint chính |
|----|----------|----------------|
| UC-01 Khởi tạo shop (onboarding) | Owner | `POST /api/auth/register` (tạo user+shop) · `POST /api/shops` · `PATCH /api/shops/:shopId/onboarding/complete/:step` |
| UC-02 Quản lý master template | Admin | `GET /api/templates` · `POST /api/layouts/master` |
| UC-03 Tùy biến thương hiệu/giao diện | Owner | `POST /api/layouts/builder/save/global` (theme) · `POST /api/media/upload` (logo) |
| UC-04 Quản lý sản phẩm | Owner | `POST /api/catalog/products` · `PATCH/DELETE /api/catalog/products/:id` · `POST /api/media/upload` |
| UC-05 Điều hướng (menu) | Owner | `POST /api/layouts/builder/save/global` (header/footer components) |
| UC-06 Trang nội dung động | Owner | builder page + `GET /api/layouts/:shopId/page/:pageType?slug=` |
| UC-07 Duyệt sản phẩm động | Customer | `GET /api/shops/bootstrap/:identifier` · `GET /api/layouts/:shopId/global` · `GET /api/products/shop/:shopId` |
| UC-08 Giỏ hàng | Customer | `GET /api/cart` · `POST /api/cart/items` · `PATCH/DELETE /api/cart/items/:itemId` |
| UC-09 Thanh toán & đơn | Customer | `POST /api/orders/checkout` · `POST /api/payments/create-url` · `POST /api/payments/webhook` |
| UC-10 Tên miền riêng | Owner/System | `PATCH /api/shops/current` (domain) + cấu hình Cloudflare Tunnel (`k8s/infrastructure/cloudflared.yaml`) |

> 5 UC chính của báo cáo ĐATN (có thứ tự): onboarding → thiết kế/xuất bản giao diện → quản lý sản phẩm → mua & thanh toán → quản lý đơn. Chi tiết: [docs/report/chapters](../docs/report/chapters/).

## Ghi chú kỹ thuật
- **Multi-tenant**: cô lập theo `shopId` (tenant context / header `x-shop-id`). Test phải kiểm shopA không thấy dữ liệu shopB.
- **Deep merge layout**: kết quả render = MasterTemplate (mặc định) merge đệ quy với TenantLayout (chỉ lưu override) → cache Redis, invalidate khi đổi config/publish.
- **Hybrid DB**: PostgreSQL (shop/order/product/...) + MongoDB (layout, chat).
- **Xử lý nền**: Bull queue `shop-build` (build/publish), `email`, `payment`.
- **Response envelope** `{ code, message, data }`, `1000`=OK ([api-doc/README](../api-doc/README.md)).
- **Postman**: collection ở thư mục `postman/` (gốc repo).
