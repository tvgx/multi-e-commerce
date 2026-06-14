# Layouts API

Cấu hình giao diện gian hàng (MongoDB): builder lưu nháp `draftData`, xuất bản đẩy `draftData → publishedData` (shop DRAFT→PUBLISHED). Base `/api/layouts`.

Storefront (public): `GET :shopId/global` · `GET :shopId/page/:pageType?slug=` · `GET tenant`.
Builder: `GET builder/schemas` · `GET :shopId/draft/global` · `GET :shopId/draft/page/:pageType` · `POST builder/save/global` · `POST builder/save/page` · `POST :shopId/seed`.
Xuất bản: `POST :shopId/publish` · `POST :shopId/publish/page/:pageType` · (admin) `POST publish`, `PATCH tenant`.

Xuất bản chạy nền qua Bull `shop-build` (module build) + worker `scripts/shop-builder`.

→ Chi tiết: [api-doc/layout](../../../../api-doc/layout/) · [api-doc/build](../../../../api-doc/build/) · [api-doc/templates](../../../../api-doc/templates/).
