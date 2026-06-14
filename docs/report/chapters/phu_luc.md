# Phụ lục — Use-case mở rộng & đặc tả phụ

> Các use-case phụ (người dùng chọn ở [00_use-cases.md](00_use-cases.md)). Mỗi mục: tác nhân, mô tả, luồng chính, endpoint. Chi tiết request/response: [api-doc](../../../api-doc/).

## A. Tìm kiếm & duyệt sản phẩm
Người mua tìm theo từ khóa và lọc (danh mục, khoảng giá, còn hàng) qua `GET /api/catalog/products` (+ public `/api/products/shop/:shopId`). Lưu lịch sử tìm kiếm: module `interactions`.

## B. Phân tích & thống kê (analytics)
Người bán xem doanh thu, đơn theo trạng thái, sản phẩm bán chạy, phễu chuyển đổi: `GET /api/analytics/{dashboard,summary,revenue,orders-by-status,top-products,customers}`. Theo dõi truy cập: `POST /api/analytics/track/visit` (phiên 30'). Giờ quy về `Asia/Ho_Chi_Minh`.

## C. Khuyến mãi / mã giảm giá
Người bán tạo/sửa mã (`/api/promotions`); người mua áp mã khi checkout, kiểm tra qua `POST /api/promotions/validate`.

## D. Vận chuyển & phí ship
Phương thức và báo giá: `GET /api/shipping/methods`, `POST /api/shipping/quote`; quản lý shipment & tracking phía người bán; dữ liệu địa giới: module `geo` (`/api/geo/provinces`).

## E. Ví khách hàng (wallet)
Người mua xem số dư, lịch sử, yêu cầu nạp tiền (`/api/wallet/me*`, `POST /api/wallet/topup`); admin duyệt topup và điều chỉnh số dư.

## F. Chat tư vấn real-time
Hội thoại người mua–shop qua socket.io, lưu MongoDB: `/api/chat/{conversations,messages}`.

## G. Sổ địa chỉ khách hàng
Quản lý địa chỉ giao hàng, đặt mặc định: `/api/addresses` (module `customer-address`).

## H. Xác thực
Người bán: `/api/auth/*` (better-auth). Người mua: `/api/storefront-auth/*` (phiên riêng).

## I. Wishlist & đánh giá sản phẩm
Yêu thích và đánh giá (1–5 sao) + kiểm duyệt phía shop: module `interactions` (`/api/interactions/{wishlist,reviews}`).

## J. Thông báo & Email
Thông báo trong app: `/api/notifications`. Email giao dịch: hàng đợi Bull `email`.

## K. Upload & quản lý media
Upload ảnh lên MinIO (3 bucket), gắn theo thực thể: `POST /api/media/upload`, `DELETE /api/media/:id`.

---

## Phụ lục kỹ thuật (đề xuất bổ sung)
- Bảng mã response toàn dự án: [api-doc/README.md](../../../api-doc/README.md).
- Sơ đồ kiến trúc monorepo & danh sách module: [.agents/apps/api-core](../../../.agents/apps/api-core/README.md).
- Đặc tả 10 use-case ShopVolo v2: [.agents/SHOPVOLO_V2_SPEC.md](../../../.agents/SHOPVOLO_V2_SPEC.md).
