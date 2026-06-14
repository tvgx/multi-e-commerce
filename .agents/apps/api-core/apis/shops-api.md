# Shops API

Tạo & quản lý gian hàng, onboarding, tài khoản ngân hàng, kho mặc định, phương thức thanh toán. Base `/api/shops`.

Route chính: `GET resolve/:identifier` · `GET bootstrap/:identifier` · `GET my-shops` · `POST /` (tạo) · `GET|PATCH current` · `PATCH bank-account` · `GET :shopId/onboarding` · `PATCH :shopId/onboarding/complete/:step` · `PATCH :shopId/warehouse` · `PATCH :shopId/payment-methods` · `GET|PATCH :shopId`.

Build/publish shop: `POST /api/shops/:shopId/build`, `GET :shopId/build-status` (module build).

→ Chi tiết request/response: [api-doc/shop](../../../../api-doc/shop/) · [api-doc/build](../../../../api-doc/build/).
