# Products / Catalog API

Sản phẩm + biến thể (variant/SKU), danh mục, bộ sưu tập, loại tùy chọn, catalog công khai. Base `/api/catalog` (+ public `/api/products/*`, `/api/collections/*`).

Route chính:
- Sản phẩm: `GET products` (lọc/phân trang) · `GET products/shop/:shopId` · `GET products/:id` · `GET products/slug/:slug` · `POST products` · `PATCH products/:id` · `DELETE products/:id` · `GET export/stream`.
- Bộ sưu tập: `GET|POST collections` · `POST collections/:id/products` · `PATCH|DELETE collections/:id` · `GET collections/:slug`.
- Danh mục: `/api/catalog/categories` (GET/POST/PATCH/DELETE).
- Loại tùy chọn: `/api/catalog/option-types` (GET/POST/PATCH/DELETE).

Tồn kho theo biến thể: module inventory. Ảnh sản phẩm: module media → MinIO.

→ Chi tiết: [api-doc/catalog](../../../../api-doc/catalog/) · [api-doc/inventory](../../../../api-doc/inventory/) · [api-doc/media](../../../../api-doc/media/).
