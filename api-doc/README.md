# API Documentation — api-core

Tài liệu API rút trực tiếp từ codebase `apps/api-core`. Mỗi module là một thư mục con; file này chứa **quy ước chung** và **bảng mã response** dùng cho toàn bộ dự án.

## Quy ước chung

| Mục | Giá trị |
|-----|---------|
| Base URL | `/api` (global prefix — [main.ts:40](../apps/api-core/src/main.ts#L40)) |
| Định dạng | JSON (`Content-Type: application/json`) |
| Xác thực | Phiên better-auth qua cookie, hoặc `Authorization: Bearer <token>`. Route admin yêu cầu đăng nhập; route storefront `(buyer-view)` đa phần công khai hoặc dùng phiên khách. |
| Multi-tenant | Hầu hết route gắn `shopId` (qua path, header `x-shop-id`, hoặc tenant context). |
| Envelope | Mọi response bọc trong `BaseResponseDto` — xem dưới. |

### Cấu trúc response (envelope)

Mọi endpoint trả về cùng một khung ([base-response.dto.ts](../apps/api-core/src/common/dto/base-response.dto.ts)). Lưu ý: dự án **không có interceptor bọc response** — controller tự gọi `BaseResponseDto.success(data)`; quên gọi thì UI nhận body rỗng.

```json
{
  "code": "1000",        // mã nghiệp vụ (string) — "1000" = thành công
  "message": "OK",       // thông điệp người đọc
  "data": { }            // payload (object | array | null), có thể vắng mặt
}
```

`success === true` khi và chỉ khi `code === "1000"`.

## Bảng mã response (toàn dự án)

Nguồn duy nhất: [response-codes.constant.ts](../apps/api-core/src/common/constants/response-codes.constant.ts). Mọi tài liệu module phải dùng đúng các mã này.

| Code | Hằng số | Ý nghĩa | HTTP thường gặp |
|------|---------|---------|-----------------|
| `1000` | `SUCCESS` | Thành công | 200 / 201 |
| `1001` | `DB_CONNECTION_ERROR` | Lỗi kết nối database | 500 |
| `1002` | `PARAM_NOT_ENOUGH` | Thiếu tham số bắt buộc | 400 |
| `1003` | `PARAM_TYPE_INVALID` | Sai kiểu tham số | 400 |
| `1004` | `PARAM_VALUE_INVALID` | Giá trị tham số không hợp lệ | 400 |
| `1005` | `UNKNOWN_ERROR` | Lỗi không xác định | 500 |
| `1006` | `FILE_SIZE_TOO_BIG` | File vượt dung lượng cho phép | 400 |
| `1007` | `UPLOAD_FILE_FAILED` | Upload file thất bại | 500 |
| `1008` | `MAXIMUM_IMAGES` | Vượt số ảnh tối đa | 400 |
| `1009` | `NOT_ACCESS` | Không đủ quyền truy cập | 403 |
| `1010` | `ACTION_DONE_PREVIOUSLY` | Hành động đã thực hiện trước đó | 409 |
| `1011` | `PRODUCT_SOLD` | Sản phẩm đã bán/hết | 409 |
| `1012` | `ADDRESS_NOT_SUPPORT_SHIPPING` | Địa chỉ không hỗ trợ giao hàng | 400 |
| `1013` | `URL_USER_IS_EXIST` | URL/định danh đã tồn tại | 409 |
| `1014` | `PROMO_CODE_EXPIRED` | Mã khuyến mãi hết hạn | 400 |
| `1015` | `CANT_PROCESS_BANK_CARD` | Không xử lý được thẻ/thanh toán | 402 |
| `1016` | `POLICY_VIOLATION` | Vi phạm chính sách | 403 |
| `1017` | `CHANGE_USERNAME_REQUIRES_30_DAYS` | Đổi username phải cách 30 ngày | 400 |
| `1018` | `CHANGE_USERNAME_SAME_OTHER` | Username trùng người khác | 409 |
| `1019` | `USER_INFO_NOT_MATCH` | Thông tin người dùng không khớp | 400 |
| `9991` | `SPAM` | Bị chặn do spam | 429 |
| `9992` | `PRODUCT_NOT_EXISTED` | Sản phẩm không tồn tại | 404 |
| `9993` | `CODE_VERIFY_INCORRECT` / `PASSWORD_NOT_CORRECT` | Sai OTP hoặc sai mật khẩu | 401 |
| `9994` | `NO_DATA_END_OF_LIST` | Hết dữ liệu / cuối danh sách | 200 |
| `9995` | `USER_NOT_VALIDATED` | Người dùng chưa xác thực | 401 |
| `9996` | `USER_EXISTED` | Người dùng đã tồn tại | 409 |
| `9997` | `METHOD_INVALID` | Method không hợp lệ | 405 |
| `9998` | `TOKEN_INVALID` | Token không hợp lệ / hết hạn | 401 |
| `9999` | `EXCEPTION_ERROR` | Lỗi ngoại lệ chung | 500 |

> Mã là **string**. `code` được trả trong envelope, độc lập với HTTP status (HTTP status do Nest/exception filter quyết định, thường 200 cho nghiệp vụ thành công).

## Danh mục module

| Module | Mô tả ngắn |
|--------|-----------|
| [analytics](analytics/) | Theo dõi truy cập + thống kê funnel/doanh thu cho người bán |
| [auth](auth/) | Xác thực người bán (admin) qua better-auth |
| [build](build/) | Hàng đợi build/publish gian hàng (Bull `shop-build`) |
| [cart](cart/) | Giỏ hàng của người mua tại storefront |
| [catalog](catalog/) | Sản phẩm, danh mục, loại tùy chọn, catalog công khai cho storefront |
| [chat](chat/) | Chat tư vấn real-time (socket.io + MongoDB) |
| [customer-address](customer-address/) | Sổ địa chỉ của khách mua hàng |
| [geo](geo/) | Dữ liệu địa giới (tỉnh/huyện/xã) cho dropdown địa chỉ |
| [interactions](interactions/) | Wishlist, đánh giá, tương tác khách hàng |
| [inventory](inventory/) | Tồn kho theo SKU/biến thể |
| [layout](layout/) | Cấu hình giao diện gian hàng (MongoDB) + xuất bản |
| [media](media/) | Upload/quản lý ảnh (MinIO/S3) |
| [notifications](notifications/) | Thông báo hệ thống cho người bán/người mua |
| [order](order/) | Đặt hàng (checkout), quản lý & xử lý đơn |
| [payment](payment/) | Thanh toán đơn hàng (Bull payment processor) |
| [promotions](promotions/) | Mã giảm giá / khuyến mãi |
| [shipping](shipping/) | Phương thức & phí vận chuyển |
| [shop](shop/) | Tạo & quản lý gian hàng, onboarding |
| [storefront-auth](storefront-auth/) | Xác thực người mua tại storefront |
| [templates](templates/) | Mẫu giao diện (theme) khởi tạo gian hàng |
| [wallet](wallet/) | Ví khách hàng |
