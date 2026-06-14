# Chương 4 — Thiết kế, triển khai & đánh giá

> Bám sát mã nguồn; phần `[…]` là chỉ dẫn vẽ hình/đo số liệu khi chuyển sang LaTeX. Endpoint dẫn chiếu: [api-doc](../../../api-doc/).

## 4.1 Thiết kế kiến trúc

### 4.1.1 Lựa chọn kiến trúc

Hệ thống theo kiến trúc **đa tầng, hướng dịch vụ** trong một monorepo, kết hợp đặc trưng **Zero-File** (mô tả giao diện bằng dữ liệu thay vì mã nguồn). Ánh xạ tầng cụ thể:

- **Tầng trình bày**: hai ứng dụng Next.js — `admin` (bảng điều khiển người bán, builder kéo–thả) và `storefront` (giao diện người mua kết xuất động từ JSON).
- **Tầng nghiệp vụ + truy cập dữ liệu**: backend `api-core` (NestJS) tổ chức theo mô hình **Controller – Service – DTO** cho khoảng 22 module; controller định tuyến và bọc phản hồi `BaseResponseDto`, service chứa nghiệp vụ, DTO mô tả dữ liệu vào/ra.
- **Tầng dùng lại**: các package `database` (Prisma client + schema), `schema` (Zod — nguồn sự thật của JSON layout), `ui-registry` (component dùng chung cho cả admin và storefront), `i18n`, `master-templates`.

Đa tenant được hiện thực bằng ngữ cảnh tenant: mỗi service lấy `shopId` qua hàm `getShopId()` (đọc từ tenant context); mọi truy vấn và thực thể đều gắn `shopId`, đảm bảo gian hàng này không truy cập dữ liệu gian hàng khác.

### 4.1.2 Thiết kế tổng quan

[Vẽ UML Package Diagram.] Các gói chính và phụ thuộc một chiều (app → package): `api-core` phụ thuộc `@ecommerce/database` (và gián tiếp `@prisma/client` được re-export); `admin` và `storefront` phụ thuộc `@ecommerce/ui-registry`, `@ecommerce/schema`, `@ecommerce/i18n`. Mọi import `@ecommerce/*` phải khai báo trong `dependencies` để Turborepo dựng đúng thứ tự phụ thuộc và tận dụng cache.

Một điểm thiết kế quan trọng là **tách enqueue và xử lý** cho tác vụ dựng gian hàng: `api-core` **chỉ** đẩy job vào hàng đợi `shop-build` và đọc tiến độ từ bảng `shop_build_jobs` (nguồn sự thật); việc dựng thực tế do **worker độc lập** (`scripts/shop-builder`, chạy bằng `ts-node`) đảm nhiệm, tái dùng `LayoutService`. Tương tự, gửi email và xử lý thanh toán có processor riêng (`email.processor`, `payment.processor`).

### 4.1.3 Thiết kế chi tiết gói

[Biểu đồ thiết kế từng package: tên lớp, quan hệ — dependency, association, inheritance.] Mỗi module `api-core` gồm bộ ba: ví dụ `ShopController`/`ShopService`, `OrderController`/`OrderService`, `LayoutController`/`LayoutService`, `BuildController`/`BuildService`, với các DTO tương ứng (`CheckoutDto`, `UpdateOrderStatusDto`, `SaveBuilderGlobalDto`…). Module `layout` và `chat` dùng thêm Mongoose model. Các service phụ thuộc lẫn nhau qua DI: `OrderService` phụ thuộc `InventoryService` (trừ tồn), `WalletService` (thanh toán/hoàn tiền ví), `ShippingService` (tính phí), `EmailService` và notification gateway.

## 4.2 Thiết kế chi tiết

### 4.2.1 Giao diện

[Đặc tả màn hình + hình minh họa cho từng use-case chính.] Phía người bán: wizard tạo gian hàng (`create-shop` → `billing-shipping`), Dashboard ở chế độ `?finalizing=true` với thanh tiến trình dựng, builder kéo–thả (`online-store/builder`) cùng `NavigationEditor`, form sản phẩm `ProductForm`, trang danh sách và chi tiết đơn. Phía người mua: trang sản phẩm, giỏ hàng, thanh toán và trang xác nhận chuyển khoản theo token. Chuẩn hóa UI: định dạng giá qua `formatPrice()`, đa ngôn ngữ qua `@ecommerce/i18n` (cookie `NEXT_LOCALE`). [Chèn ảnh từ `docs/master-template/` và screenshot thực tế.]

### 4.2.2 Thiết kế lớp & biểu đồ trình tự

**Các lớp chủ đạo** (nêu thuộc tính + phương thức chính):

- `LayoutService` — quản lý cấu hình giao diện trên MongoDB: `getGlobalLayout`/`getPageLayout` (đọc `publishedData`), `getBuilderGlobal`/`saveBuilderGlobal`/`saveBuilderPage` (thao tác `draftData`), `publishLayoutByShopId`/`publishPage` (vật chất hóa ảnh, sao `draftData → publishedData`), `markShopPublished` (`DRAFT → PUBLISHED`), `seedDefaultLayouts`.
- `OrderService` — `createOrder` (checkout trong transaction), `updateOrderStatus` (máy trạng thái), `cancelOrder`, `refundOrder`, `findAllOrders`.
- `ShopService` — `createShop`, `getOnboardingProgress`, `completeOnboardingStep`, `upsertWarehouse`, `setPaymentMethods`.
- `BuildService` — `enqueueBuild` (chống trùng job), `getLatestStatus` (đọc `shop_build_jobs`).

**Biểu đồ trình tự 1 — UC-1 Tạo & dựng gian hàng**: `admin` → `POST /api/auth/register` → `ShopService.createShop` → (wizard) `completeOnboardingStep` → `POST /api/layouts/:shopId/seed` (`LayoutService.seedDefaultLayouts`) → `POST /api/shops/:shopId/build` → `BuildService.enqueueBuild` (tạo `shop_build_jobs` = QUEUED, `buildQueue.add`) → worker xử lý cập nhật `percent`/`status` → `admin` poll `GET /api/shops/:shopId/build-status` cho tới `COMPLETED`.

**Biểu đồ trình tự 2 — UC-2 Xuất bản giao diện**: `admin builder` → `POST /api/layouts/builder/save/global|page` (lưu `draftData`) → `POST /api/layouts/:shopId/publish` → `LayoutService` vật chất hóa ảnh → ghi `publishedData` → `markShopPublished` (`DRAFT → PUBLISHED`) → `storefront` đọc `publishedData` qua `GET /api/layouts/:shopId/global`.

**Biểu đồ trình tự 3 — UC-4 Checkout**: `storefront` → `POST /api/orders/checkout` → `OrderService.createOrder`: tải biến thể + tính `subtotal` → validate khuyến mãi → tính phí ship → mở `$transaction` { `InventoryService.decrementStock` → cập nhật `Promotion.usedCount` + `PromotionUsage` → (nếu ví) `WalletService.debit` → tạo `Order` + `LineItem` → tạo `Payment` → xóa `CartItem` → tạo `Shipment(pending)` → (nếu BankTransfer) tạo `PaymentConfirmToken` } → sinh QR ngoài transaction → thông báo người mua. [Vẽ ba biểu đồ trình tự trên.]

### 4.2.3 Thiết kế cơ sở dữ liệu

Dự án dùng kiến trúc dữ liệu lai. **PostgreSQL** (qua Prisma) lưu dữ liệu nghiệp vụ có cấu trúc; schema tách theo domain trong `packages/database/prisma/models/*.prisma` và ghép qua `build-prisma-schema.js` (file model mới phải khai báo trong `MODEL_FILES`). **MongoDB** (qua Mongoose) lưu cấu hình giao diện (`layout`, với cặp `draftData`/`publishedData`) và hội thoại `chat`.

[Vẽ ER diagram cho miền đặt hàng.] Các thực thể và quan hệ chính:

- `Shop` 1–n `Product`; `Product` n–1 `Category` (cây qua `parentId`); `Product` 1–n `Variant` (đơn vị bán, ràng buộc duy nhất `(shopId, sku)`).
- Biến thể–tùy chọn: `Product` n–n `OptionType` (qua `ProductOptionType`); `Variant` n–n `OptionValue` (qua `VariantOptionValue`); `OptionType` 1–n `OptionValue`.
- `Customer` 1–n `Cart` 1–n `CartItem` → `Variant`.
- `Order` 1–n `LineItem` → `Variant`; `Order` 1–n `Payment` → `PaymentMethod`; `Order` 1–n `Shipment` → `ShippingMethod`; `Order` n–1 `Customer`, n–1 `Shop`. Địa chỉ giao được **snapshot** vào `Order` (không khóa ngoại sang `CustomerAddress`, vì khách có thể sửa/xóa địa chỉ sau).
- `PaymentConfirmToken` n–1 `Order`/`Payment` (token chuyển khoản, hết hạn 24h); `PromotionUsage` n–1 `Promotion`; `ShopBuildJob` n–1 `Shop`.

Các trường trạng thái quan trọng: `Order.state` (`cart`/`checkout`/`confirmed`/`processing`/`shipped`/`delivered`/`completed`/`canceled`/`returned`/`refunded`), `Order.paymentState`, `Order.shipmentState`; `Payment.state`; `Shop.status` (`DRAFT`/`PUBLISHED`) và `onboardingStep`/`onboardingStatus`. Chỉ mục tối ưu: `(shopId, createdAt)`, `(shopId, state)` trên `orders`; `(shopId, status)`, `(shopId, slug)` trên `products`.

## 4.3 Xây dựng ứng dụng

### 4.3.1 Thư viện & công cụ

[Bảng: Mục đích | Công cụ | Phiên bản | URL.] Backend: NestJS 11, Prisma, Mongoose, Bull, better-auth, AWS-S3 SDK, socket.io, nestjs-zod, sharp/blurhash (xử lý ảnh), qrcode. Frontend: Next.js (App Router), Tailwind. Hạ tầng: PostgreSQL, MongoDB, Redis, MinIO, Kubernetes, Docker. Công cụ: Turborepo, Node 22, Jest, Playwright.

### 4.3.2 Kết quả đạt được

[Mô tả sản phẩm + bảng thống kê: số module, endpoint, bảng, LOC.] Backend gồm khoảng 22 module với 25 controller; tài liệu API đầy đủ (request/response từng endpoint) ở [api-doc](../../../api-doc/); 16 nhóm model Prisma cho PostgreSQL và schema Mongoose cho layout/chat. [Bổ sung số liệu thực đo bằng `cloc` và đếm endpoint.]

### 4.3.3 Minh họa các chức năng chính

[Screenshot + giải thích ngắn cho 5 use-case chính.] (1) Wizard tạo gian hàng và Dashboard finalizing với thanh tiến trình; (2) builder kéo–thả và thao tác xuất bản; (3) form sản phẩm với biến thể và upload ảnh; (4) giỏ hàng, trang thanh toán và QR chuyển khoản; (5) danh sách đơn và cập nhật trạng thái theo máy trạng thái.

## 4.4 Kiểm thử

Backend dùng **Jest** với mẫu **prisma-mock** (mock `PrismaService`) cho unit test các service; xác thực better-auth được stub qua `test/stubs` + `moduleNameMapper` để vượt vấn đề ESM. Admin dùng **Playwright** cho E2E (`npm run test:ui`).

[Đặc tả test case cho 2–3 use-case quan trọng + kỹ thuật kiểm thử.] Đề xuất:

- **UC-4 Checkout** (kiểm thử nhánh): đặt hàng từ giỏ thành công; giỏ rỗng → `1002`; biến thể không thuộc gian hàng → `1002`; mã khuyến mãi hết hạn/hết lượt → `1014`; ví không đủ số dư → rollback (đơn không được tạo, tồn không bị trừ).
- **UC-5 Cập nhật trạng thái** (kiểm thử máy trạng thái): chuyển hợp lệ `confirmed → processing`; chuyển sai `checkout → shipped` → `1004`; kiểm tra đồng bộ `shipmentState` khi `shipped`.
- **UC-2 Xuất bản** (kiểm thử tích hợp Mongo): lưu `draftData` rồi publish → `publishedData` khớp, `Shop.status = PUBLISHED`.

[Tổng kết: số test case, tỉ lệ pass, lỗi phát hiện.]

## 4.5 Triển khai

Triển khai trên **Kubernetes** (`k8s/`): các app trong `k8s/apps/` (`api-core`, `admin`, `storefront`, `design-agent`); hạ tầng trong `k8s/infrastructure/` (MinIO, Redis, Cloudflared, monitoring); định tuyến qua `k8s/ingress/`; sao lưu định kỳ qua CronJob (`k8s/backup/`, `k8s/jobs/`); tác vụ CLI trong `k8s/cli/`; mẫu độ sẵn sàng (anti-affinity, pod-disruption-budget) trong `k8s/templates/`. Tên miền riêng định tuyến qua Cloudflare Tunnel.

Môi trường phát triển cục bộ dùng `docker/docker-compose.yaml`; cổng dev: `api-core` 3000, `admin` 3001, `storefront` 3002. Toàn dự án chốt Node 22 (`.nvmrc` + `engines`). [Nêu kết quả thực tế: số gian hàng demo, thời gian phản hồi trung bình, thời gian dựng một gian hàng, RPM chịu tải.]
