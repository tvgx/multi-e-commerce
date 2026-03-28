# 🚀 E-commerce Platform - `api-core`

Đây là dịch vụ backend trung tâm của nền tảng thương mại điện tử multi-tenant, được xây dựng bằng **NestJS 11**. `api-core` chịu trách nhiệm quản lý dữ liệu, xác thực, và cung cấp API cho cả Admin Dashboard và Storefront Engine.

---

## 🏗️ Kiến trúc Hệ thống

### 1. Hybrid Database Strategy
Chúng tôi sử dụng sự kết hợp giữa SQL và NoSQL để tối ưu hóa hiệu suất:
*   **PostgreSQL (Prisma)**: Lưu trữ dữ liệu có cấu trúc, yêu cầu tính toàn vẹn cao (ACID) như: Người dùng, Cửa hàng (Shops), Sản phẩm cơ bản, Đơn hàng, Tồn kho.
*   **MongoDB (Mongoose)**: Lưu trữ dữ liệu linh hoạt, phi cấu trúc như: Layout cấu hình của từng shop, Master Templates, Content blocks.

### 2. Isolation & Multi-tenancy
Để đảm bảo an toàn dữ liệu giữa các khách hàng (Tenants):
*   **AsyncLocalStorage**: Sử dụng để lưu trữ `tenantId` (shopId) xuyên suốt vòng đời của một request.
*   **TenantInterceptor**: Tự động trích xuất shopId từ domain hoặc header và gán vào context.
*   **Database Scoping**: Mọi câu lệnh truy vấn Prisma/Mongoose đều được tự động filter theo `shopId` hiện tại.

---

## 📚 Danh mục API & Hướng dẫn Testing

Dưới đây là danh sách các endpoints chính. Bạn có thể sử dụng `curl` để test nhanh.
*Mặc định host là `http://localhost:3000`.*

### 1. 📊 Analytics (`/analytics`)
*   **Tổng quan toàn hệ thống (Admin)**:
    ```bash
    curl -X GET http://localhost:3000/analytics/master-summary
    ```
*   **Thống kê chi tiết từng Shop**:
    ```bash
    curl -X GET http://localhost:3000/analytics/shop/ID_SHOP/summary
    ```

### 2. 🎨 Layout & Storefront (`/api/layouts` & `/api/storefront`)
Đây là phần cốt lõi của **Zero-File Engine**.
*   **Lấy Layout đã compile cho Storefront**:
    ```bash
    curl -X GET http://localhost:3000/api/storefront/shop.yourdomain.com/layout
    ```
*   **Publish Layout mới (Visual Builder)**: 🔒
    ```bash
    curl -X POST http://localhost:3000/api/layouts/publish \
      -H "Content-Type: application/json" \
      -d '{"shopId": "ID_SHOP", "nodes": [], "theme": {}}'
    ```

### 3. 📦 Sản phẩm (`/api/products`)
*   **Tạo sản phẩm mới**: 🔒
    ```bash
    curl -X POST http://localhost:3000/api/products \
      -H "Content-Type: application/json" \
      -d '{"shopId": "ID_SHOP", "name": "Sản phẩm mới", "price": 150000, "stock": 100}'
    ```
*   **Danh sách sản phẩm theo Shop**:
    ```bash
    curl -X GET "http://localhost:3000/api/products/shop/ID_SHOP?limit=20"
    ```

### 4. 🏪 Cửa hàng (`/api/shops`)
*   **Tạo Shop mới (Đăng ký Tenant)**: 🔒
    ```bash
    curl -X POST http://localhost:3000/api/shops \
      -H "Content-Type: application/json" \
      -d '{"name": "Cửa hàng của tôi", "domain": "my-store.local"}'
    ```

---

## 🛠️ Cài đặt & Chạy Local

1.  **Cài đặt**: `npm install`
2.  **Biến môi trường**: Copy `.env.example` thành `.env` và điền thông số.
3.  **Database**:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```
4.  **Chạy Dev**: `npm run start:dev`

> [!WARNING]
> Luôn sử dụng DTO và Zod Schema để validate dữ liệu đầu vào. Tuyệt đối không sử dụng `any` trong code backend.
