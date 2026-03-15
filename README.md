# Platform Multi-tenant E-commerce (Zero-File Layout Engine)

Chào mừng bạn đến với nền tảng thương mại điện tử đa kênh (multi-tenant) thế hệ mới, được tích hợp công cụ thiết kế giao diện động (Zero-File Layout Engine) và kiến trúc dữ liệu Hybrid tối ưu cho hiệu năng và khả năng mở rộng.

---

## 🚀 Hướng dẫn cài đặt nhanh

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản >= 18.
- **Docker**: Để chạy PostgreSQL và MongoDB (hoặc cài đặt trực tiếp trên máy).
- **Package Manager**: NPM (khuyến nghị v11+).

### 2. Cài đặt Dependencies
Từ thư mục gốc của project:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo hoặc chỉnh sửa file `.env` ở thư mục gốc:
```env
# PostgreSQL (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# MongoDB (Mongoose)
MONGO_DB_ATLAS="mongodb://localhost:27017/ecommerce_layouts"

# Auth & App
PORT=3001
BETTER_AUTH_SECRET="your_secret_key"
BETTER_AUTH_URL="http://localhost:3001"
```

### 4. Khởi tạo Cơ sở dữ liệu
```bash
# Tạo Prisma Client
npx prisma generate --schema packages/database/prisma/schema.prisma

# Chạy migration để khởi tạo bảng trong PostgreSQL
npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma
```

### 5. Chạy project
Sử dụng Turborepo để chạy tất cả các ứng dụng (API, Admin, Storefront) cùng lúc:
```bash
npm run dev
```

---

## 🏗️ Thiết kế Cơ sở dữ liệu Hybrid

Dự án sử dụng mô hình **Hybrid SQL/NoSQL** để tận dụng ưu điểm của cả hai thế giới:

### 1. PostgreSQL (via Prisma) - Core Transactional Data
Quản lý các dữ liệu có cấu trúc chặt chẽ, yêu cầu tính toàn vẹn cao (ACID):
- **Users & Auth**: Thông tin người dùng, session, quyền hạn.
- **Shops**: Danh sách các cửa hàng trên nền tảng.
- **Products & Variants**: Thông tin sản phẩm cơ bản, giá, mã SKU, thuộc tính.
- **Inventory**: Quản lý tồn kho theo kho hàng (Stock Locations).
- **Orders & Payments**: Quy trình xử lý đơn hàng và thanh toán.

### 2. MongoDB (via Mongoose) - Flexible Layout Data
Quản lý các dữ liệu phi cấu trúc hoặc cấu trúc linh hoạt, tần suất đọc cao:
- **Product Layouts**: Nội dung mô tả sản phẩm (HTML), gallery ảnh, các thuộc tính linh hoạt.
- **Master Templates**: Các mẫu giao diện cửa hàng có sẵn.
- **Layout Caching**: Lưu trữ các phiên bản giao diện đã được merge để phục vụ rendering tốc độ cao.

> [!TIP]
> Sự kết hợp này giúp hệ thống vừa đảm bảo tính chính xác của đơn hàng/kho hàng (SQL), vừa cho phép các chủ cửa hàng tùy biến giao diện cực kỳ linh hoạt mà không cần thay đổi schema database (NoSQL).

---

## 🎨 Hướng dẫn Master Templates

Hệ thống cung cấp một bộ các **Master Templates** giúp bạn khởi tạo giao diện cho cửa hàng mới chỉ trong vài giây.

### Vị trí Templates
Các template mặc định được lưu trữ dưới dạng JSON tại: `packages/master-templates/src/`.
- `fashion.json`: Dành cho cửa hàng thời trang.
- `home-appliances.json`: Dành cho điện máy, gia dụng.
- `mom-and-baby.json`: Dành cho mẹ và bé.
- `ready-to-eat.json`: Dành cho thực phẩm, đồ ăn nhanh.

### Cách sử dụng
Khi tạo một Shop mới thông qua API hoặc Admin Dashboard, bạn có thể chọn một `templateId`. Hệ thống sẽ:
1. Đọc file JSON tương ứng từ package `master-templates`.
2. Lưu dữ liệu này vào `ShopTemplate` trong MongoDB của Shop đó.
3. Đồng bộ hóa với `MergedLayoutsCache` để Storefront có thể hiển thị ngay lập tức.

### Tùy chỉnh Template
Bạn có thể chỉnh sửa các file JSON trong `packages/master-templates` để thay đổi giao diện mặc định cho toàn bộ nền tảng, hoặc tùy chỉnh riêng cho từng shop thông qua công cụ **Visual Builder** trong Storefront.

---

## 🛠️ Stack Công nghệ
- **Monorepo**: Turborepo.
- **Backend**: NestJS, Prisma, Mongoose.
- **Frontend**: Next.js 15 (App Router), TailwindCSS.
- **Authentication**: Better Auth.
- **UI System**: Shadcn/UI (Registry).
