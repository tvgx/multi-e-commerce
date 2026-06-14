# Module: catalog

Sản phẩm + biến thể (variant/SKU), danh mục (category), bộ sưu tập (collection), loại tùy chọn (option-type), và catalog công khai cho storefront. Gồm 4 controller:

- [`catalog.controller.ts`](../../apps/api-core/src/modules/catalog/catalog.controller.ts) — `@Controller('catalog')` → `/api/catalog`
- [`category.controller.ts`](../../apps/api-core/src/modules/catalog/category.controller.ts) — `/api/catalog/categories`
- [`option-type.controller.ts`](../../apps/api-core/src/modules/catalog/option-type.controller.ts) — `/api/catalog/option-types`
- [`storefront-catalog.controller.ts`](../../apps/api-core/src/modules/catalog/storefront-catalog.controller.ts) — public, không prefix (`/api/products/*`, `/api/collections/*`)

Auth: route đọc cho storefront là `@Public()`; route ghi yêu cầu role `ADMIN`/`OWNER`.

---

## Sản phẩm (`/api/catalog/products`)

### `GET /api/catalog/products` — query `GetProductsDto`
Phân trang + lọc sản phẩm.

| Field (query) | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `page` | ❌ | int ≥ 1 | Mặc định 1 |
| `limit` | ❌ | int ≥ 1 | Mặc định 20 |
| `sortBy` | ❌ | string | Mặc định `createdAt` |
| `sortOrder` | ❌ | `ASC`\|`DESC` | Mặc định `DESC` |
| `search` | ❌ | string | Từ khoá |
| `categoryId` | ❌ | string | Lọc theo danh mục |
| `minPrice` / `maxPrice` | ❌ | number ≥ 0 | Khoảng giá |
| `inStockOnly` | ❌ | boolean | Chỉ còn hàng |
| `status` | ❌ | string | `DRAFT`\|`PUBLISHED`\|`ARCHIVED` |
| `shopId` | ❌ | string | Phạm vi shop |

**Response** `data`: `{ items: Product[], total, page, limit }`.

### `GET /api/catalog/products/shop/:shopId` — query `GetProductsDto`
Sản phẩm của 1 shop. `shopId` (path) + các query như trên.

### `GET /api/catalog/products/:id`
Chi tiết sản phẩm theo id. `id` (path).

### `GET /api/catalog/products/slug/:slug`
Chi tiết theo slug. `slug` (path).

### `POST /api/catalog/products` — Auth, `CreateProductDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `name` | ✅ | string | |
| `slug` | ✅ | string | |
| `description` | ❌ | string | |
| `categoryId` | ❌ | string | |
| `status` | ❌ | string | DRAFT/PUBLISHED/ARCHIVED |
| `variants` | ❌ | array | Mỗi phần tử: `sku`✅(string), `price`✅(number), `weight`?(number), `currency`?(string) |
| `imageUrl` | ❌ | string | Ảnh đại diện |
| `images` | ❌ | string[] | Danh sách ảnh (key MinIO) |

```json
{
  "name": "Áo thun", "slug": "ao-thun", "categoryId": "cat_1", "status": "PUBLISHED",
  "variants": [ { "sku": "AT-M", "price": 150000, "weight": 0.2, "currency": "VND" } ],
  "images": ["shop_1/prod_1-0", "shop_1/prod_1-1"]
}
```

### `PATCH /api/catalog/products/:id` — Auth
Body = `UpdateProductDto` (partial của `CreateProductDto`). `id` (path).

### `DELETE /api/catalog/products/:id` — Auth
Xoá sản phẩm. `id` (path).

### `GET /api/catalog/export/stream` — Auth
Xuất danh sách sản phẩm dạng stream (StreamableFile). Không tham số.

---

## Bộ sưu tập (`/api/catalog/collections`) — Auth (trừ GET by slug)

### `POST /api/catalog/collections` — `CreateCollectionDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `title` | ✅ | string | |
| `slug` | ✅ | string | |
| `description` | ❌ | string | |
| `imageUrl` | ❌ | string (url) | |
| `productIds` | ❌ | string[] | SP đưa vào bộ sưu tập |

### `GET /api/catalog/collections` — Auth
Danh sách bộ sưu tập.

### `POST /api/catalog/collections/:id/products` — Auth
Thêm SP vào bộ sưu tập. `id` (path). Body: `{ "productIds": string[] }`.

### `PATCH /api/catalog/collections/:id` — Auth
Body = `UpdateCollectionDto` (partial).

### `DELETE /api/catalog/collections/:id` — Auth
Xoá bộ sưu tập.

### `DELETE /api/catalog/collections/:collectionId/products/:productId` — Auth
Gỡ 1 SP khỏi bộ sưu tập.

### `GET /api/catalog/collections/:slug` — Public
Lấy bộ sưu tập theo slug. `slug` (path); `shopId` (query).

---

## Danh mục (`/api/catalog/categories`)

| Route | Auth | Mô tả |
|-------|------|-------|
| `GET /` | Public | Danh sách danh mục |
| `GET /slug/:slug` | Public | Theo slug |
| `GET /:id` | Public | Theo id |
| `POST /` | Auth | Tạo — `CreateCategoryDto` |
| `PATCH /:id` | Auth | Cập nhật (partial) |
| `DELETE /:id` | Auth | Xoá |

**`CreateCategoryDto`**: `name`✅(string), `slug`✅(string), `description`?(string), `imageUrl`?(url), `parentId`?(string), `position`?(int ≥ 0), `isActive`?(boolean).

---

## Loại tùy chọn (`/api/catalog/option-types`)

| Route | Auth | Mô tả |
|-------|------|-------|
| `GET /` | Public | Danh sách |
| `GET /:id` | Public | Theo id |
| `POST /` | Auth | Tạo — `name`✅, `presentation`✅ |
| `PATCH /:id` | Auth | Cập nhật (`name`?, `presentation`?) |
| `DELETE /:id` | Auth | Xoá |

---

## Storefront public (`storefront-catalog.controller`)
Trùng đường dẫn public để storefront gọi trực tiếp: `GET /api/products/shop/:shopId`, `GET /api/products/slug/:slug`, `GET /api/products/:id`, `GET /api/collections/:slug?shopId=`.

---

**Lỗi thường gặp**: `9992` sản phẩm không tồn tại · `1002` thiếu tham số · `1009` không đủ quyền (route ghi) · `1004` giá trị không hợp lệ.
