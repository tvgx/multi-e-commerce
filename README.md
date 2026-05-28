# Multi E-Commerce Platform

Đây là dự án nền tảng e-commerce multi-tenant sử dụng kiến trúc Monorepo (Turborepo) với Node.js, Next.js, NestJS và hệ cơ sở dữ liệu phân tán (PostgreSQL, MongoDB, MinIO, Redis...).

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Từ A-Z)

### 1. Yêu Cầu Hệ Thống
* **Node.js**: Phiên bản >= 22.0.0
* **Package Manager**: `npm`
* **Docker & Docker Compose**: Để chạy các dịch vụ database và hạ tầng mạng lưu trữ.

### 2. Cài Đặt Dependencies
Mở terminal tại thư mục gốc của dự án (`multi-e-commerce`) và chạy:
```bash
npm install
```

### 3. Khởi Động Hệ Thống Database & Infrastructure
Dự án sử dụng Docker Compose để chạy các dịch vụ cần thiết (Postgres, MongoDB, Minio, Imgproxy...).
```bash
# Khởi chạy các dịch vụ ở chế độ chạy ngầm (background)
docker compose -f docker/docker-compose.yaml up -d
```
> **Lưu ý:** Bạn có thể xóa dòng `version:` trong file `docker/docker-compose.yaml` để tránh các cảnh báo version obsolete từ Docker bản mới.

### 4. Cấu Hình & Cập Nhật Database Schema (Prisma)
Sau khi các database đã hoạt động, bạn cần tạo schema và chạy migration cho PostgreSQL:
```bash
npm run prisma:generate
npm run prisma:migrate
```
*(Nếu muốn xem dữ liệu qua giao diện Prisma Studio, bạn dùng lệnh `npm run prisma:studio`)*

### 5. Khởi Chạy Môi Trường Phát Triển (Development)
Sử dụng lệnh sau để khởi chạy toàn bộ các apps (Front-end, Back-end API...) thông qua Turborepo:
```bash
npm run dev
```

---

## 🐳 Quản Lý Các Dịch Vụ Docker Compose

Sau khi đã cài đặt xong, trong quá trình làm việc hàng ngày, bạn có thể sử dụng các lệnh Docker Compose sau để quản lý các services:

### 🔹 Kiểm tra trạng thái
Xem các container nào đang chạy và thông tin port của chúng:
```bash
docker compose -f docker/docker-compose.yaml ps
```

### 🔹 Dừng tạm thời (Stop)
Lệnh này dừng các container nhưng không xóa chúng. Dữ liệu và trạng thái được giữ nguyên.
```bash
docker compose -f docker/docker-compose.yaml stop
```

### 🔹 Chạy lại (Start)
Bật lại các container đã bị dừng ở trên:
```bash
docker compose -f docker/docker-compose.yaml start
```

### 🔹 Khởi động lại (Restart)
Tắt đi và bật lại ngay lập tức (dùng khi bạn vừa sửa đổi file cấu hình môi trường):
```bash
docker compose -f docker/docker-compose.yaml restart
```

### 🔹 Tắt hoàn toàn (Down)
Lệnh này **dừng và xóa** luôn các container và mạng ảo (network). Dữ liệu vẫn được giữ an toàn trong các Volumes.
```bash
docker compose -f docker/docker-compose.yaml down
```
> *Khi cần chạy lại từ đầu, bạn chỉ cần gọi lại lệnh `docker compose -f docker/docker-compose.yaml up -d`.*

---

## 🛠 Các Lệnh Khác (Scripts)

Dự án cung cấp sẵn một số lệnh hữu ích trong `package.json`:
- `npm run build`: Build toàn bộ source code production.
- `npm run lint`: Chạy linter kiểm tra code.
- `npm run format`: Format lại code với Prettier.
- `npm run sync:layout`: Đồng bộ giao diện cấu hình layout (tham khảo kiến trúc Zero-file).
- `npm run generate:master`: Tạo master template.
