# Chương 2 — Khảo sát & phân tích yêu cầu

> Use-case chính chốt ở [00_use-cases.md](00_use-cases.md). Đặc tả dưới đây bám sát hiện thực trong mã nguồn; endpoint dẫn chiếu: [api-doc](../../../api-doc/).

## 2.1 Khảo sát hiện trạng

Khảo sát được thực hiện từ ba nguồn. Thứ nhất, từ phía người bán nhỏ lẻ: nhu cầu sở hữu một gian hàng trực tuyến mang thương hiệu riêng là phổ biến, nhưng phần lớn người bán không có kỹ năng lập trình và không đủ ngân sách thuê phát triển website. Thứ hai, từ các hệ thống thương mại điện tử tự xây: tuy kiểm soát được dữ liệu và tùy biến, chi phí xây dựng và vận hành cho từng cửa hàng rất lớn, khó nhân rộng cho hàng nghìn gian hàng. Thứ ba, từ các nền tảng tương tự đang phổ biến (Shopify, WooCommerce, Haravan): cho phép tạo gian hàng nhanh nhưng mức độ tùy biến giao diện bị ràng buộc bởi theme dựng sẵn, đồng thời phát sinh chi phí theo tháng.

[Chèn bảng so sánh ưu/nhược điểm giữa ba nhóm.] Từ khảo sát, các tính năng cần phát triển được xác định: cho phép người bán tự thiết kế giao diện bằng công cụ kéo–thả; phục vụ nhiều gian hàng trên một mã nguồn (đa tenant) với dữ liệu cô lập; và cung cấp đầy đủ nghiệp vụ bán hàng (sản phẩm, giỏ hàng, đơn hàng, thanh toán, vận chuyển, khuyến mãi).

## 2.2 Tổng quan chức năng

### 2.2.1 Biểu đồ use-case tổng quát

[Vẽ biểu đồ use-case tổng quát.] Hệ thống có bốn tác nhân:

- **Người bán (Tenant Owner)** — vai trò `OWNER`/`ADMIN`: tạo và cấu hình gian hàng, thiết kế giao diện, quản lý sản phẩm/danh mục, quản lý đơn hàng, cấu hình khuyến mãi và vận chuyển, xem phân tích.
- **Người mua (Customer)**: duyệt và tìm sản phẩm, quản lý giỏ hàng, đặt hàng và thanh toán, theo dõi đơn, đánh giá sản phẩm.
- **Quản trị nền tảng (Platform Admin)**: quản lý mẫu giao diện gốc (master template), theo dõi toàn nền tảng.
- **Hệ thống/Cron**: thực thi các tác vụ nền qua hàng đợi Bull — dựng và xuất bản gian hàng (`shop-build`), gửi email (`email`), xử lý thanh toán (`payment`).

### 2.2.2 Mô hình miền dữ liệu cốt lõi

Một **gian hàng (Shop)** sở hữu nhiều **sản phẩm (Product)**; mỗi sản phẩm thuộc một **danh mục (Category)** có cấu trúc cây và có nhiều **biến thể (Variant)** — đơn vị có giá và `sku` để bán. Biến thể được mô tả qua **loại tùy chọn (OptionType)** và **giá trị tùy chọn (OptionValue)**. Khi mua, người mua tạo **giỏ hàng (Cart)** chứa các **dòng giỏ (CartItem)** tham chiếu biến thể; khi đặt, hệ thống sinh **đơn hàng (Order)** với các **dòng đơn (LineItem)**, **thanh toán (Payment)** và **lô giao (Shipment)**. Mọi thực thể đều gắn `shopId` để cô lập theo tenant. [Vẽ sơ đồ lớp khái niệm; chi tiết ER ở §4.2.3.]

### 2.2.3 Quy trình nghiệp vụ trọng tâm

[Vẽ biểu đồ hoạt động cho vòng đời "Tạo gian hàng → thiết kế → xuất bản → bán → xử lý đơn".] Người bán đăng ký tài khoản kèm tạo gian hàng (trạng thái `DRAFT`), đi qua sáu bước onboarding, thiết kế giao diện trên builder rồi xuất bản (gian hàng chuyển `PUBLISHED`); người mua truy cập storefront, thêm sản phẩm vào giỏ và thanh toán; đơn hàng đi qua máy trạng thái cho tới khi hoàn tất hoặc bị hủy/hoàn.

## 2.3 Đặc tả các use-case chính

### UC-1: Tạo & khởi tạo gian hàng

- **Tác nhân**: Người bán.
- **Tiền điều kiện**: Email hợp lệ và chưa được đăng ký.
- **Hậu điều kiện**: Gian hàng được tạo ở trạng thái `DRAFT` (`onboardingStep = 1`); tài khoản chủ shop được khởi tạo; tiến trình onboarding được lưu trong `onboardingStatus` (JSON); job dựng gian hàng được đưa vào hàng đợi `shop-build`.
- **Luồng chính**:
  1. Người bán đăng ký (`POST /api/auth/register`) với email, mật khẩu (≥6 ký tự), tên và tên gian hàng. Hệ thống tạo tài khoản và gian hàng (`POST /api/shops`, tiền tệ mặc định `VND`).
  2. Wizard dẫn người bán qua sáu bước onboarding: **(step1) Create Store**, **(step2) Add Products**, **(step3) Add Collections**, **(step4) Design UI**, **(step5) Setup Payment**, **(step6) Shipping & Tax**. Tiến trình truy vấn qua `GET /api/shops/:shopId/onboarding`: bước được tính `COMPLETED` dựa trên dữ liệu thực tế (số sản phẩm, số bộ sưu tập, số phương thức thanh toán, số phương thức vận chuyển và kho).
  3. Người bán cấu hình kho lấy hàng (`PATCH /api/shops/:shopId/warehouse`) và phương thức thanh toán cơ bản COD/chuyển khoản (`PATCH /api/shops/:shopId/payment-methods`).
  4. Mỗi bước hoàn tất gọi `PATCH /api/shops/:shopId/onboarding/complete/:step`, cập nhật `onboardingStep` (lấy giá trị lớn nhất) và đánh dấu `step{n}: COMPLETED`. Hoàn tất **step 6** đặt trạng thái gian hàng thành `PUBLISHED`.
  5. Hệ thống seed các trang mặc định (`POST /api/layouts/:shopId/seed`) và đẩy job dựng (`POST /api/shops/:shopId/build`). Dashboard mở với cờ `?finalizing=true` và poll `GET /api/shops/:shopId/build-status` để hiển thị tiến độ.
- **Quy tắc nghiệp vụ**: Việc đẩy job dựng có **chống trùng** — nếu đã tồn tại job `QUEUED`/`RUNNING` thì trả lại job đó thay vì xếp chồng (tránh double-click). Bản ghi tiến độ lưu ở bảng `shop_build_jobs` với `status ∈ {QUEUED, RUNNING, COMPLETED, FAILED}`, `percent`, `stage`, `storefrontUrl`.
- **Luồng phát sinh**: Email đã tồn tại (`9996`); domain/định danh trùng (`1013`); thiếu trường bắt buộc (`1002`); job dựng thất bại (`FAILED`) → hiển thị lỗi để thử lại (job cấu hình `attempts: 2`, backoff lũy thừa).

### UC-2: Thiết kế & xuất bản giao diện

- **Tác nhân**: Người bán.
- **Tiền điều kiện**: Gian hàng đã được tạo; đã đăng nhập quyền `OWNER`/`ADMIN`.
- **Hậu điều kiện**: Bản nháp giao diện lưu ở `draftData`; khi xuất bản, `draftData` được vật chất hóa (xử lý ảnh) và sao chép sang `publishedData`, gian hàng chuyển `DRAFT → PUBLISHED`.
- **Luồng chính**:
  1. Người bán mở builder (`online-store/builder`); hệ thống nạp schema component (`GET /api/layouts/builder/schemas`) và bản nháp hiện có (`GET /api/layouts/:shopId/draft/global`, `/draft/page/:pageType`). Khi `draftData` rỗng, hệ thống dùng `publishedData` làm điểm xuất phát.
  2. Người bán kéo–thả, cấu hình header/footer và theme; lưu nháp global (`POST /api/layouts/builder/save/global` — lưu `globalComponents` và `theme`) và từng trang (`POST /api/layouts/builder/save/page` — lưu `components` theo `pageType`).
  3. Chỉnh sửa điều hướng bằng `NavigationEditor`.
  4. Xem trước rồi xuất bản: toàn bộ (`POST /api/layouts/:shopId/publish`) hoặc từng trang (`POST /api/layouts/:shopId/publish/page/:pageType`) phục vụ wizard thiết kế theo bước. Khi xuất bản, ảnh trong layout được vật chất hóa và gian hàng được đánh dấu `PUBLISHED` (đồng thời ghi nhận hoàn tất bước thiết kế).
- **Quy tắc nghiệp vụ**: Endpoint storefront chỉ đọc `publishedData` (endpoint nóng nhất, dùng projection + lean để tối ưu); builder thao tác trên `draftData` để không ảnh hưởng giao diện đang chạy.
- **Luồng phát sinh**: Thiếu `shopId` (`1002`); gian hàng không tồn tại (`404`); xuất bản nhưng store kẹt Fast Refresh → tải lại trang admin.

### UC-3: Quản lý sản phẩm & danh mục

- **Tác nhân**: Người bán.
- **Tiền điều kiện**: Đã đăng nhập quyền `OWNER`/`ADMIN`.
- **Hậu điều kiện**: Sản phẩm/biến thể/danh mục được tạo hoặc cập nhật; ảnh được lưu trên MinIO.
- **Luồng chính**:
  1. Tạo danh mục (`POST /api/catalog/categories`) — `slug` duy nhất trong phạm vi gian hàng, hỗ trợ cây danh mục (`parentId`).
  2. Tạo sản phẩm qua `ProductForm` (`POST /api/catalog/products`) với tên, `slug` (duy nhất theo `shopId`), mô tả, danh mục, danh sách biến thể (mỗi biến thể có `sku` duy nhất theo `shopId`, `price`, tùy chọn cân nặng/tiền tệ) và ảnh.
  3. Upload ảnh (`POST /api/media/upload`) — lưu vào bucket `shop-public` với key `<shopId>/<productId>-N`; ảnh giao diện vào bucket `shop-layouts`.
  4. Quản lý tồn kho theo biến thể (`POST /api/inventory/adjust` với `variantId`, `stockLocationId`, `quantityDelta`, `reason`); tồn được trừ tự động khi đặt hàng.
  5. Cập nhật/xóa sản phẩm (`PATCH/DELETE /api/catalog/products/:id`).
- **Quy tắc nghiệp vụ**: Biến thể là đơn vị bán (có giá và sku); sản phẩm là nhóm biến thể. Ràng buộc duy nhất `(shopId, slug)` cho sản phẩm/danh mục và `(shopId, sku)` cho biến thể.
- **Luồng phát sinh**: Sản phẩm/biến thể không tồn tại (`9992`); thiếu trường (`1002`); ảnh quá lớn (`1006`) hoặc vượt số lượng (`1008`).

### UC-4: Mua hàng & thanh toán

- **Tác nhân**: Người mua.
- **Tiền điều kiện**: Gian hàng đã `PUBLISHED`; người mua có phiên storefront khi checkout.
- **Hậu điều kiện**: Đơn hàng được tạo; tồn kho được trừ; bản ghi thanh toán được tạo; giỏ hàng được xóa nếu checkout từ giỏ.
- **Luồng chính**:
  1. Người mua thêm biến thể vào giỏ (`POST /api/cart/items` với `variantId`, `quantity ≥ 1`); cập nhật/xóa dòng (`PATCH/DELETE /api/cart/items/:itemId`, `quantity = 0` để xóa).
  2. Checkout (`POST /api/orders/checkout`). Nếu không truyền `lineItems`, hệ thống lấy toàn bộ giỏ phía server. Tải giá biến thể từ CSDL (không tin giá phía client), tính `subtotal`.
  3. Nếu có `promotionCode`: kiểm tra mã thuộc gian hàng, đang `isActive`, trong khoảng `startsAt`–`expiresAt`, chưa vượt `usageLimit`; tính giảm theo `percentage` hoặc `fixed`.
  4. Nếu có `shippingMethodId`: tính phí qua `ShippingService.computeFee` (xét ngưỡng miễn phí) và cộng vào tổng. Địa chỉ giao: ưu tiên `shippingAddress` inline, nếu không thì lấy từ sổ địa chỉ (`shippingAddressId`) và chụp ảnh (snapshot) vào đơn.
  5. Trong một **giao dịch (transaction)**: trừ tồn kho; tăng `usedCount` của khuyến mãi và ghi `PromotionUsage`; nếu thanh toán bằng **ví** thì trừ tiền trước (không đủ số dư → rollback toàn bộ); tạo `Order`, tạo `Payment`, xóa giỏ (nếu checkout từ giỏ), tạo `Shipment` trạng thái `pending`.
  6. Khởi tạo phiên thanh toán: với **chuyển khoản (BankTransfer)**, sinh `PaymentConfirmToken` hiệu lực 24 giờ và URL xác nhận `…/payment/confirm/<token>`; mã QR được sinh **ngoài transaction** (giảm thời gian khóa hàng tồn). Cổng thanh toán gọi `POST /api/payments/webhook`; xác nhận thủ công qua `POST /api/payments/confirm`.
- **Quy tắc trạng thái**: Đơn thanh toán bằng ví khởi tạo `state = confirmed`, `paymentState = paid`; các phương thức khác khởi tạo `state = checkout`, `paymentState = balance_due`. `Payment.state ∈ {checkout, awaiting_confirmation, processing, completed, failed, void, refunded}`.
- **Luồng phát sinh**: Giỏ rỗng / thiếu lineItems (`1002`); biến thể không thuộc gian hàng (`1002`); mã khuyến mãi sai/hết hạn/hết lượt (`1014`); phương thức vận chuyển/thanh toán không hợp lệ (`1004`); địa chỉ đã lưu không tồn tại; số dư ví không đủ → rollback.

### UC-5: Quản lý đơn hàng

- **Tác nhân**: Người bán.
- **Tiền điều kiện**: Đã đăng nhập quyền `OWNER`/`ADMIN`; có đơn hàng.
- **Hậu điều kiện**: Trạng thái đơn được cập nhật theo máy trạng thái; lô giao được đồng bộ; người mua được thông báo; hoàn tiền nếu cần.
- **Luồng chính**:
  1. Người bán xem danh sách (`GET /api/orders`), lọc theo `state`/`paymentState`/`shipmentState`, phân trang; xem chi tiết (`GET /api/orders/:id`).
  2. Cập nhật trạng thái (`PATCH /api/orders/:id/status`) theo **máy trạng thái** hợp lệ: `checkout → {confirmed, canceled}`; `confirmed → {processing, canceled}`; `processing → {shipped, canceled}`; `shipped → {delivered, returned}`; `delivered → {returned, completed}`; các trạng thái `completed`, `canceled`, `returned` là kết thúc. Chuyển sai → lỗi `1004`.
  3. Khi chuyển `shipped`/`delivered`/`returned`/`canceled`, **lô giao được đồng bộ** tương ứng (cập nhật `shippedAt`/`deliveredAt`...), và đơn cập nhật `shipmentState`. Người mua được thông báo (notification gateway) và nhận email khi đơn `shipped`.
  4. Hoàn tiền (`POST /api/orders/:id/refund`): đặt `paymentState = refunded`, `state = canceled`; nếu thanh toán bằng ví thì hoàn tiền vào ví khách. Đơn đã hoàn trước đó → lỗi.
  5. Người mua có thể tự hủy đơn của mình (`POST /api/orders/:id/cancel`) khi đơn còn ở trạng thái cho phép.
- **Luồng phát sinh**: Chuyển trạng thái không hợp lệ (`1004`); thao tác đã thực hiện (`1010`); không đủ quyền (`1009`).

## 2.4 Yêu cầu phi chức năng

**Hiệu năng**: storefront kết xuất từ JSON `publishedData` (đọc bằng projection + lean, cache Redis); danh sách sản phẩm/đơn có chỉ mục `(shopId, createdAt)`, `(shopId, state/status)` để truy vấn nhanh; thao tác sinh QR và xử lý ảnh đặt ngoài transaction để rút ngắn thời gian khóa tồn kho. **Độ tin cậy**: tác vụ nặng (dựng/xuất bản, email, thanh toán) chạy nền qua hàng đợi với cơ chế retry; checkout bọc trong transaction đảm bảo tính nguyên tử (trừ tồn, trừ ví, tạo đơn cùng thành công hoặc cùng rollback). **Khả năng mở rộng**: một mã nguồn phục vụ nhiều gian hàng, dữ liệu cô lập theo `shopId`. **Dễ dùng**: người bán thao tác qua giao diện kéo–thả, không cần lập trình. **Bảo trì**: monorepo Turborepo, component dùng chung ở `packages/ui-registry`, schema JSON định nghĩa ở `packages/schema`. **Yêu cầu kỹ thuật**: PostgreSQL + MongoDB, Redis, MinIO; vận hành được trên tài nguyên hạn chế (WSL2).
