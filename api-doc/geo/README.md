# Module: geo

Dữ liệu địa giới hành chính (tỉnh/phường-xã) cho dropdown địa chỉ ở wizard kho hàng & checkout. Controller: [`geo.controller.ts`](../../apps/api-core/src/modules/geo/geo.controller.ts) — base `@Controller('geo')` → `/api/geo`. Dữ liệu seed qua `seed:geo`.

---

## `GET /api/geo/provinces`
Danh sách tỉnh/thành. Không tham số.

**Response** `data`: `[{ code, name, ... }]`.

## `GET /api/geo/provinces/:code/wards`
Phường/xã thuộc 1 tỉnh. `code` (path, bắt buộc — mã tỉnh).

**Response** `data`: `[{ code, name, ... }]`.

---

**Lỗi**: `9994` không có dữ liệu · `1004` mã tỉnh không hợp lệ.
