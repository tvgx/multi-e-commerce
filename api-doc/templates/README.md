# Module: templates

Danh sách mẫu giao diện (master template) dùng để khởi tạo gian hàng. Controller: [`templates.controller.ts`](../../apps/api-core/src/modules/templates/templates.controller.ts) — base `@Controller('templates')` → `/api/templates`. Auth: `BetterAuthGuard`.

---

## `GET /api/templates` — Auth
Danh sách master template. Không tham số.

**Response** `data`: `[{ id, industry, name, schema, ... }]`.

---

> Liên quan: tạo/áp template layout xem [layout](../layout/) (`POST /api/layouts/master`).

**Lỗi**: `9998` token không hợp lệ.
