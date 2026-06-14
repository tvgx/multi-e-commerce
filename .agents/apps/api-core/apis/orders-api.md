# Orders API

Đặt hàng (checkout) phía người mua + quản lý/xử lý đơn phía người bán. Base `/api/orders`.

Khách (StorefrontAuthGuard): `POST checkout` (tạo đơn từ giỏ; mã KM, ship, địa chỉ) · `GET my` · `POST :id/cancel`.
Người bán (role ADMIN/OWNER): `GET /` (lọc state/paymentState/shipmentState) · `GET :id` · `PATCH :id/status` (confirmed→…→completed/canceled/returned) · `POST :id/refund`.

Liên quan: giỏ hàng [api-doc/cart](../../../../api-doc/cart/), thanh toán [api-doc/payment](../../../../api-doc/payment/) (Bull `payment`), vận chuyển [api-doc/shipping](../../../../api-doc/shipping/).

→ Chi tiết request/response: [api-doc/order](../../../../api-doc/order/).
