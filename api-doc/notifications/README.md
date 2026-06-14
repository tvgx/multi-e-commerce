# Module: notifications

Thông báo hệ thống cho người bán (đơn mới, sự kiện shop...). Controller: [`notifications.controller.ts`](../../apps/api-core/src/modules/notifications/notifications.controller.ts) — base `@Controller('notifications')` → `/api/notifications`. Auth: cả controller `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `GET /api/notifications` — query `GetNotificationsDto`
Danh sách thông báo.

| Field (query) | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `unreadOnly` | ❌ | boolean | Chỉ chưa đọc |
| `page`,`limit`,... | ❌ | (pagination) | |

## `PATCH /api/notifications/:id/read`
Đánh dấu 1 thông báo đã đọc. `id` (path).

## `PATCH /api/notifications/read-all`
Đánh dấu tất cả đã đọc. Không tham số.

## `DELETE /api/notifications/:id`
Xoá 1 thông báo. `id` (path).

---

**Lỗi**: `9998` token không hợp lệ · `1009` không đủ quyền.
