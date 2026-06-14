# Module: media

Upload & xoá ảnh, lưu trên **MinIO/S3** (3 bucket: ảnh giao diện → `shop-layouts`, ảnh sản phẩm → `shop-public` key `<shopId>/<productId>-N`). Controller: [`media.controller.ts`](../../apps/api-core/src/modules/media/media.controller.ts) — base `@Controller('media')` → `/api/media`. Auth: cả controller `BetterAuthGuard` + role `ADMIN`/`OWNER`.

---

## `POST /api/media/upload` — multipart/form-data, `UploadMediaDto`
Upload 1 file ảnh (field file qua `@UploadedFile`).

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `file` | ✅ | file (multipart) | Ảnh cần upload |
| `entityType` | ❌ | string | `product`/`collection`/`layout`/`layout_image`/`shop_logo`/`theme` |
| `entityId` | ❌ | string | Id thực thể gắn ảnh |

**Response** `data`: `{ url, key, ... }`.

## `DELETE /api/media/:id`
Xoá file theo id/key. `id` (path).

---

**Lỗi**: `1006` file quá lớn · `1007` upload thất bại · `1008` vượt số ảnh tối đa · `1009` không đủ quyền.
