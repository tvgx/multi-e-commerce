# Danh sách Use-case — Báo cáo ĐATN

> File điều phối: chốt **5 use-case chính** (đặc tả đầy đủ ở [Chương 2](02_khao_sat.md), minh họa ở [Chương 4](04_thiet_ke_trien_khai.md)) và danh sách use-case phụ (đưa vào [Phụ lục](phu_luc.md)). Endpoint dẫn chiếu xem [api-doc](../../../api-doc/).

## 5 Use-case chính (đã chốt — có thứ tự)

Phủ 3 trục tác nhân: **người bán tạo shop · người bán chỉnh sửa shop · người mua mua hàng** + quản lý đơn.

| # | Use-case | Tác nhân | Phạm vi code | Endpoint chính |
|:-:|----------|----------|--------------|----------------|
| 1 | **Tạo & khởi tạo gian hàng** | Người bán | `apps/admin/create-shop/*`, module `shop` + `build` | `POST /api/auth/register`, `POST /api/shops`, `PATCH /api/shops/:shopId/onboarding/complete/:step`, `POST /api/shops/:shopId/build` |
| 2 | **Thiết kế & xuất bản giao diện** | Người bán | `online-store/builder`, `NavigationEditor`, module `layout` (MongoDB) | `POST /api/layouts/builder/save/{global,page}`, `POST /api/layouts/:shopId/publish` |
| 3 | **Quản lý sản phẩm & danh mục** | Người bán | `products`, `collections`, `inventory`, `ProductForm`, module `catalog`/`inventory`/`media` | `POST/PATCH/DELETE /api/catalog/products`, `POST /api/media/upload` |
| 4 | **Mua hàng & thanh toán** | Người mua | storefront `cart`→`payment`, module `cart`/`order`/`payment` | `POST /api/cart/items`, `POST /api/orders/checkout`, `POST /api/payments/create-url` |
| 5 | **Quản lý đơn hàng** | Người bán | `dashboard/[shopId]/orders/*`, module `order` | `GET /api/orders`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/refund` |

## Use-case phụ (Phụ lục) — người dùng tick chọn đưa vào / nâng lên chính

Mặc định tất cả vào Phụ lục. Đánh dấu `[x]` nếu muốn viết kỹ trong phụ lục, `(↑)` nếu muốn nâng lên use-case chính (sẽ phải hạ 1 UC chính xuống).

- [] **Tìm kiếm & duyệt sản phẩm** — header search, all-products, public catalog API.
- [x] **Phân tích & thống kê (analytics)** — dashboard, funnel/conversion, top-products; module `analytics`.
- [x] **Khuyến mãi / mã giảm giá** — module `promotions` (`validate` khi checkout).
- [ ] **Vận chuyển & phí ship** — module `shipping` + `geo` (báo giá, shipment, tracking).
- [ ] **Ví khách hàng (wallet)** — số dư, nạp tiền, duyệt topup; module `wallet`.
- [ ] **Chat tư vấn real-time** — socket.io + MongoDB; module `chat`.
- [ ] **Sổ địa chỉ khách hàng** — module `customer-address`.
- [ ] **Xác thực** — người bán (`auth`) + người mua (`storefront-auth`).
- [ ] **Wishlist & đánh giá sản phẩm** — module `interactions`.
- [ ] **Thông báo** — module `notifications`.
- [ ] **Thông báo qua email** — Bull queue `email`.
- [ ] **Upload & quản lý media** — module `media` (MinIO 3 bucket).

> Sau khi người dùng chọn, cập nhật [Chương 2](02_khao_sat.md) §2.2 (use-case tổng quát) và [Phụ lục](phu_luc.md) tương ứng.
