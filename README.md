# 🛒 Multi-tenant E-commerce Platform (SaaS Engine)

Chào mừng bạn đến với nền tảng thương mại điện tử đa kênh (multi-tenant) thế hệ mới. Đây không chỉ là một website bán hàng đơn lẻ, mà là một **SaaS Engine** được thiết kế theo triết lý **"Zero-File Doctrine"**.

---

## 🏗️ Kiến trúc Core: "Zero-File" Doctrine

Hệ thống được thiết kế để phục vụ hàng ngàn khách hàng (Tenants) mà không cần tạo thêm bất kỳ file code giao diện (`.tsx` hoặc `.page.tsx`) nào cho từng shop.

*   **Registry**: Toàn bộ UI Components nằm tập trung tại `packages/ui-library` (dựa trên shadcn/ui).
*   **Blueprint**: Cấu trúc mặc định của các ngành hàng (Thời trang, Điện tử,...) được định nghĩa qua `MasterTemplate` (MongoDB).
*   **Override**: Mỗi cửa hàng (Tenant) sẽ có một bản `TenantLayout` (MongoDB) chứa các thay đổi riêng biệt (JSON diff).
*   **Engine**: `apps/storefront` (Next.js 15) nhận `tenantId`, gọi API lấy JSON cấu hình và sử dụng **Dynamic Component Resolver** để render giao diện tương ứng.

---

## 🚀 Hướng dẫn cài đặt nhanh

### 1. Yêu cầu hệ thống
*   **Node.js**: Phiên bản >= 18.
*   **Docker**: Để chạy PostgreSQL và MongoDB (hoặc cài đặt trực tiếp trên máy).
*   **Bộ nhớ**: Khuyên dùng tối thiểu 16GB RAM (Tối ưu hóa cho WSL2).

### 2. Cài đặt Dependencies
Từ thư mục gốc của project:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc:
```env
# PostgreSQL (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# MongoDB (Mongoose)
MONGO_DB_ATLAS="mongodb://localhost:27017/ecommerce_layouts"

# Auth & App
PORT=3001
BETTER_AUTH_SECRET="your_secret_key"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Khởi tạo Cơ sở dữ liệu
```bash
# Tạo Prisma Client
npx prisma generate --schema packages/database/prisma/schema.prisma

# Chạy migration khởi tạo bảng
npx prisma migrate dev --schema packages/database/prisma/schema.prisma
```

### 5. Chạy project
Sử dụng **Turborepo** để khởi chạy toàn bộ hệ thống:
```bash
npm run dev
```

---

## 🛠️ CLI & Workflow (Quan trọng)

Để quản lý Layout và Template hiệu quả, hãy sử dụng các lệnh CLI sau thay vì thao tác tay vào Database:

*   **Đồng bộ Layout**: Cập nhật cấu hình từ file `layout.config.ts` vào MongoDB.
    ```bash
    npm run sync:layout --shop-id=<id>
    ```
*   **Tạo Template mẫu**: Khởi tạo layout mặc định cho một ngành hàng mới.
    ```bash
    npm run generate:master --industry=<type>
    ```

---

## 💻 Tech Stack & Monorepo Mapping

*   `apps/api-core` (**NestJS 11**):
    *   Prisma cho PostgreSQL (Metadata: Owners, Shops, Orders).
    *   Mongoose cho MongoDB (Layouts: Master & Child JSON).
    *   Multi-tenancy qua `AsyncLocalStorage` để cô lập dữ liệu.
*   `apps/storefront` (**Next.js 15 - App Router**):
    *   Sử dụng Server Components làm mặc định.
    *   Dynamic Rendering dựa trên Tenant JSON.
*   `packages/ui-library` (**Shared UI**):
    *   Sử dụng **shadcn/ui** (Radix).
    *   Mọi component phải hỗ trợ `className` qua hàm `cn()`.
*   `packages/schema` (**Shared Zod**):
    *   Nguồn sự thật duy nhất (Single Source of Truth) cho các JSON Layout.

---

## ⚡ Giới hạn Tài nguyên (16GB RAM Rule)

Dự án được tối ưu cho môi trường máy cá nhân:
*   **Quản lý bộ nhớ**: Luôn đóng kết nối DB khi không sử dụng.
*   **Tốc độ**: Sử dụng Cache linh hoạt để tránh gọi API lặp lại.
*   **WSL2**: Toàn bộ project nên đặt ở ổ đĩa logic (D:) và được mount đúng cách vào WSL để đạt hiệu năng tốt nhất.

---

> [!TIP]
> Khi bạn chỉnh sửa bất kỳ Component nào trong `ui-library`, hãy nhớ kiểm tra tính tương thích với JSON Schema tại `packages/schema`.

