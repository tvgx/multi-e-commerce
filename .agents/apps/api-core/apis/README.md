# API Core — Endpoints

> Tài liệu endpoint **đầy đủ, rút từ code** nằm ở [`/api-doc`](../../../../api-doc/) (mỗi module 1 thư mục, bảng request/response). File ở đây chỉ tóm tắt nhanh.

- Base URL: `/api` (global prefix). KHÔNG phải `/api/v1`.
- Xác thực: phiên better-auth (cookie) hoặc `Authorization: Bearer`; storefront có guard riêng.
- Response: envelope `{ code, message, data }`, `code "1000"` = OK. Bảng mã: [api-doc/README](../../../../api-doc/README.md).
- Phân trang: `?page=&limit=&sortBy=&sortOrder=ASC|DESC&search=`.

Tóm tắt theo module: [shops](shops-api.md) · [products](products-api.md) · [orders](orders-api.md) · [layouts](layouts-api.md) · [analytics](analytics-api.md). Các module khác (cart, payment, shipping, promotions, wallet, ...) xem trực tiếp [api-doc](../../../../api-doc/).
