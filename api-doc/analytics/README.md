# Module: analytics

Theo dõi truy cập (đếm phiên 30') và thống kê funnel/doanh thu cho người bán; bảng tổng quan cấp nền tảng cho admin. Controllers: [`analytics.controller.ts`](../../apps/api-core/src/modules/analytics/analytics.controller.ts) → `/api/analytics`; [`analytics-tracking.controller.ts`](../../apps/api-core/src/modules/analytics/analytics-tracking.controller.ts) → `/api/analytics/track`.

Auth: dashboard yêu cầu `BetterAuthGuard` + role `ADMIN`/`OWNER`; track visit là `@Public()`.

> Quy đổi giờ đặt hàng về `Asia/Ho_Chi_Minh`; dữ liệu conversion/funnel chỉ có từ 2026-06-13.

---

## Thống kê shop (`/api/analytics`, query `period`)

| Route | Mô tả |
|-------|-------|
| `GET /dashboard?period=` | Tổng hợp bảng điều khiển |
| `GET /summary?period=` | Số liệu tóm tắt (doanh thu, đơn, khách...) |
| `GET /revenue?period=` | Chuỗi doanh thu theo thời gian |
| `GET /orders-by-status?period=` | Số đơn theo trạng thái |
| `GET /top-products?period=&limit=` | SP bán chạy |
| `GET /customers?period=&limit=` | Insight khách hàng |

`period` (query, tùy chọn, string — vd `7d`,`30d`). `limit` (query, tùy chọn, số).

## Thống kê nền tảng (admin, `/api/analytics/platform`)

`GET /platform/dashboard`, `/platform/summary`, `/platform/revenue`, `/platform/top-shops?limit=` — đều nhận `period?`.

## `POST /api/analytics/track/visit` — Public
Ghi nhận lượt truy cập (validate tay trong service).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `shopId` | ✅* | string (≤64) | *Bắt buộc thực tế dù DTO optional |
| `visitorId` | ✅* | string (≤64) | Định danh khách ẩn danh |
| `customerId` | ❌ | string | Nếu đã đăng nhập |
| `path` | ❌ | string | Đường dẫn trang |

---

**Response** bọc envelope `{ code, message, data }`. **Lỗi**: `1002` thiếu `shopId`/`visitorId` · `1009` không đủ quyền.
