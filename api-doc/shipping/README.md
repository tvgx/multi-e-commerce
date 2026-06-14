# Module: shipping

Phương thức & phí vận chuyển, báo giá ship khi checkout, theo dõi & quản lý lô giao (shipment). Controller: [`shipping.controller.ts`](../../apps/api-core/src/modules/shipping/shipping.controller.ts) — base `@Controller('shipping')` → `/api/shipping`. Auth: `methods`/`quote` công khai cho storefront; `track` cần `StorefrontAuthGuard`; quản lý method/shipment cần role `ADMIN`/`OWNER`.

---

## `GET /api/shipping/methods`
Phương thức vận chuyển khả dụng (storefront).

## `POST /api/shipping/quote` — `ShippingQuoteDto`
Báo giá phí ship.

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `shippingMethodId` | ✅ | string | |
| `subtotal` | ✅ | number ≥ 0 | Tạm tính đơn (để xét miễn phí) |

## `GET /api/shipping/track/:orderId` — Khách
Theo dõi giao hàng của đơn. `orderId` (path).

## Quản lý (Auth, role ADMIN/OWNER)

### `GET /api/shipping/methods/all`
Tất cả phương thức (kể cả tắt).

### `POST /api/shipping/methods` — `CreateShippingMethodDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ✅ | string | |
| `description` | ❌ | string | |
| `baseFee` | ✅ | number ≥ 0 | Phí cơ bản |
| `freeThreshold` | ❌ | number ≥ 0 | Ngưỡng miễn phí ship |
| `estimatedDays` | ❌ | string | vd `2-3` |
| `active` | ❌ | boolean | |
| `position` | ❌ | number | Thứ tự hiển thị |

### `PATCH /api/shipping/methods/:id` — `UpdateShippingMethodDto`
Các field optional (`freeThreshold: null` để bỏ ngưỡng). `id` (path).

### `DELETE /api/shipping/methods/:id`
Xoá phương thức.

### `GET /api/shipping/shipments` — query `{ orderId?, state?, page?, limit? }`
Danh sách lô giao.

### `PATCH /api/shipping/shipments/:id` — `UpdateShipmentDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `state` | ❌ | enum | `pending`/`ready`/`shipped`/`delivered`/`returned`/`canceled` |
| `carrier` | ❌ | string | Đơn vị vận chuyển |
| `trackingNumber` | ❌ | string | Mã vận đơn |
| `note` | ❌ | string | |

---

**Lỗi**: `1012` địa chỉ không hỗ trợ giao · `1002` thiếu tham số · `1009` không đủ quyền.
