# Analytics API

Theo dõi truy cập (phiên 30') + thống kê funnel/doanh thu cho người bán; tổng quan nền tảng cho admin. Base `/api/analytics`.

Shop (role ADMIN/OWNER, query `period`): `GET dashboard` · `summary` · `revenue` · `orders-by-status` · `top-products?limit=` · `customers?limit=`.
Nền tảng: `GET platform/dashboard|summary|revenue|top-shops`.
Tracking (public): `POST /api/analytics/track/visit` (`shopId`, `visitorId` bắt buộc).

Lưu ý: giờ đặt hàng quy về `Asia/Ho_Chi_Minh`; dữ liệu conversion có từ 2026-06-13.

→ Chi tiết: [api-doc/analytics](../../../../api-doc/analytics/).
