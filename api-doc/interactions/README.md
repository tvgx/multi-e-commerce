# Module: interactions

Tương tác khách hàng: wishlist, lịch sử tìm kiếm, đánh giá (review) sản phẩm + kiểm duyệt review phía shop. Controller: [`interactions.controller.ts`](../../apps/api-core/src/modules/interactions/interactions.controller.ts) — base `@Controller('interactions')` → `/api/interactions`. Auth: route khách dùng `StorefrontAuthGuard`; review công khai `@Public()`; duyệt review yêu cầu role `ADMIN`/`OWNER`.

---

## Wishlist — Khách
- `POST /api/interactions/wishlist/toggle` — `ToggleWishlistDto`: `productId`✅(string).
- `GET /api/interactions/wishlist` — danh sách wishlist.
- `DELETE /api/interactions/wishlist/:productId` — gỡ 1 SP.

## Lịch sử tìm kiếm — Khách
- `POST /api/interactions/search-history` — `AddSearchHistoryDto`: `query`✅(string).
- `GET /api/interactions/search-history` — danh sách.
- `DELETE /api/interactions/search-history` — xoá toàn bộ.

## Đánh giá (review)
### `POST /api/interactions/reviews` — Khách, `CreateReviewDto`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|:-------:|------|-------|
| `productId` | ✅ | string | |
| `rating` | ✅ | number 1–5 | |
| `title` | ❌ | string | |
| `body` | ❌ | string | |

### `GET /api/interactions/reviews` — Public, query `GetReviewsDto`
`productId?`(string) + phân trang.

### `GET /api/interactions/reviews/admin` — Auth, query `GetAdminReviewsDto`
`productId?`, `status?` (`published`|`pending`|`hidden`) + phân trang.

### `PATCH /api/interactions/reviews/:id/status` — Auth, `UpdateReviewStatusDto`
`status`✅ ∈ `published`|`pending`|`hidden`.

### `PATCH /api/interactions/reviews/:id` — Khách, `UpdateReviewDto`
`rating?`(1–5), `title?`, `body?`.

### `DELETE /api/interactions/reviews/:id` — Khách
Xoá review của mình.

---

**Lỗi**: `9998`/`401` chưa đăng nhập · `9992` sản phẩm không tồn tại · `1004` rating ngoài 1–5 · `1009` không đủ quyền duyệt.
