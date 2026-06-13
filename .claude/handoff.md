# Kế Hoạch Phát Triển Flow Billing & Shipping và Dashboard Finalizing

Flow hiện tại sẽ được cập nhật lại theo đúng cấu trúc thực tế, loại bỏ những bước rườm rà và tối ưu cho ngữ cảnh kinh doanh tại Việt Nam.

## 1. Flow Mới

1. Người dùng vào Wizard tạo Shop -> Chọn Tên, Domain, Giao diện (Step 1).
2. Tùy chỉnh Giao diện: Home, Product Listing, Product Detail.
3. Chỉnh sửa Navigation: Gắn link cho các nút bấm. **(Bấm "Lưu Navigation" -> Chuyển sang trang Billing & Shipping, bỏ màn hình Loading ở bước này).**
4. **(MỚI)** Trang Billing & Shipping: Thiết lập cấu hình thanh toán và giao hàng cơ bản. **(Bấm "Hoàn tất" -> Chuyển sang Dashboard với trạng thái Finalizing).**
5. **(CẬP NHẬT)** Dashboard: Hiển thị giao diện "Shop đang được tạo" kèm % chạy. Khi Backend hoàn tất cấu hình, % đạt 100%, hiển thị URL Storefront chính thức.

---

## 2. Giao Diện Mẫu (Text Mockup)

### 2.1. Page Billing & Shipping (`/create-shop/billing-shipping`)
Trang này được thiết kế tinh gọn, được bổ sung như một step chính thức trong cấu trúc Wizard Topbar (đồng bộ Topbar ở TẤT CẢ các bước trong Flow).

```text
[Topbar Wizard: Cập nhật thêm step "Billing & Shipping" vào thanh tiến trình, áp dụng hiển thị ở MỌI step]

📦 Phương thức vận chuyển
[x] Phí vận chuyển đồng giá (Fixed Rate)
    | Mức phí: [ 30.000 ] VNĐ
[x] Miễn phí vận chuyển (Freeship)
    | Áp dụng cho đơn hàng từ: [ 500.000 ] VNĐ

💳 Phương thức thanh toán
[x] Thanh toán khi nhận hàng (COD)
    | Cho phép khách hàng kiểm tra hàng trước khi thanh toán.
[x] Chuyển khoản ngân hàng
    | Ngân hàng: [ Vietcombank       ] (Dropdown)
    | Tên TK:    [ NGUYEN VAN A      ]
    | Số TK:     [ 0123456789        ]

📍 Địa chỉ kho hàng mặc định
Tỉnh/Thành phố: [ TP. Hồ Chí Minh    ] (Dữ liệu từ DB)
Phường/Xã:      [ Phường Bến Nghé    ] (Dữ liệu từ DB)
Địa chỉ cụ thể: [ 123 Lê Lợi         ]

                                               [ Lưu và Hoàn tất tạo Shop ]
```

### 2.2. Dashboard Trong Lúc Tạo Shop (`/dashboard/[shopId]?finalizing=true`)
Phần banner "Welcome to your store" hiện tại sẽ được thay thế hoàn toàn bởi khung xử lý này.

```text
=========================================================
🚀 OmniAdmin | Khởi tạo cửa hàng
=========================================================

       [ Icon Loading Xoay Vòng - Indigo ]
   SHOP CỦA BẠN ĐANG ĐƯỢC TẠO, BẠN CHỜ CHÚT NHÉ...
       Đang cấu hình Database và Giao diện...

  [=======================>                ]  63%
```

### 2.3. Dashboard Sau Khi Hoàn Thành (100%)

```text
=========================================================
🚀 OmniAdmin | Khởi tạo cửa hàng
=========================================================
   
       Shop của bạn đã sẵn sàng tại:
       👉 ae.my-shop.omnicommerce.com (Clickable)

  [======== Tiến trình hoàn tất 100% ========]

             [ Truy cập trang Quản trị ]
```

---

## 3. Kế Hoạch Triển Khai Kỹ Thuật (Technical Plan)

### Bước 1: Gỡ bỏ Loading Modal ở `NavigationEditor.tsx`
- Hủy bỏ `isFinalizing` overlay đã làm trước đó.
- Sửa hàm `handleSave` trong `isWizard`: Thay vì gọi `publishTemplate(shopId)`, ta chỉ lưu dữ liệu navigation, sau đó gọi `router.push('/create-shop/billing-shipping?shopId=${shopId}')`.

### Bước 2: Tạo trang `/create-shop/billing-shipping/page.tsx`
- Layout chia thành 3 section: Shipping (Giao hàng), Payment (Thanh toán), Address (Địa chỉ kho).
- **Lưu ý dữ liệu địa chỉ:** Lấy toàn bộ thông tin Tỉnh/Thành phố và Phường/Xã (bỏ cấp Quận/Huyện) sau khi sáp nhập và viết script đẩy hết vào Database (tạo seed script). Các dropdown địa chỉ trên UI sẽ fetch dữ liệu chuẩn từ DB này.
- Khi user bấm "Lưu và Hoàn tất", gửi dữ liệu này xuống backend rồi điều hướng sang `/dashboard/${shopId}?finalizing=true`.

### Bước 2.1: Cập nhật Wizard Topbar
- Chỉnh sửa `EDITABLE_PAGE_KEYS` và `GuidedTopbar` để hiển thị thêm step Billing & Shipping, đảm bảo thanh Topbar Progress được render đồng nhất xuyên suốt quá trình (từ trang Design cho tới trang Billing).

### Bước 3: Cập nhật `OnboardingDashboard` (`/dashboard/[shopId]/page.tsx`)
- Bắt param `?finalizing=true` từ URL.
- Nếu có param này, ẩn các UI hiện tại và hiển thị Box "Đang tạo shop" với `progressPercentage` chạy từ 0 đến 100%.
- Trong lúc tiến trình % chạy:
  1. Frontend gọi `await publishTemplate(shopId)` (biên dịch giao diện).
  2. Frontend gọi `PATCH /api/shops/:shopId` để chuyển status sang `PUBLISHED`.
- Khi các API ngầm này hoàn thành, ép tiến trình % lên 100%.
- Tại 100%: Thay đổi nội dung UI thành "Shop của bạn đã sẵn sàng tại: `<storefrontUrl(shopId)>`".

## Open Questions / Yêu cầu phản hồi
- Phần Địa chỉ kho hàng, Ngân hàng trong mục thanh toán mình sẽ sử dụng dạng text input/dropdown tĩnh (mock) để bạn có thể xem UI trước, không bắt buộc tích hợp API bên thứ 3 nào đúng không? - trả lời: kho hàng đưa vào db dựa trên thông tin người bán đưa vào, note lại cho người bán "kho hàng là nơi shipper sẽ đến để lấy hàng", ngân hàng thì chỉ sử dụng agribank hoặc vietinbank hoặc vietcombank hoặc MB
- URL mẫu `ae.<url-storefront>` ý bạn là subdomain `ae.` cộng với tên miền shop? Hiện tại hàm `storefrontUrl()` đang trả về định dạng `http://<domain>.omnicommerce.com`. Mình sẽ cập nhật hiển thị theo chuẩn bạn mong muốn. đúng theo định dạng hiện tại. tuy vậy cấu trúc thực tế mà dev nhìn thấy chỉ là omnicommerce.com/<domain>/ và server sẽ làm việc theo url đó.
