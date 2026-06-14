# Module: inventory

Tồn kho theo biến thể (variant) và vị trí kho (stock location); điều chỉnh tồn + lịch sử biến động. Controller: [`inventory.controller.ts`](../../apps/api-core/src/modules/inventory/inventory.controller.ts) — base `@Controller('inventory')` → `/api/inventory`. Auth: cả controller `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `GET /api/inventory/variants/:id`
Tồn kho của 1 biến thể (gộp theo các kho). `id` (path — variantId).

**Response** `data`: `{ variantId, totalOnHand, locations: [...] }`.

## `POST /api/inventory/adjust` — `AdjustStockDto`
Điều chỉnh tồn kho.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `variantId` | ✅ | string | Biến thể |
| `stockLocationId` | ✅ | string | Kho |
| `quantityDelta` | ✅ | number | Dương = cộng, âm = trừ |
| `reason` | ✅ | string | Lý do điều chỉnh |

## `GET /api/inventory/variants/:id/movements`
Lịch sử biến động tồn. `id` (path); `page?`, `limit?` (query, số).

---

**Lỗi**: `9992` biến thể không tồn tại · `1002` thiếu tham số · `1009` không đủ quyền.
