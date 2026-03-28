# 🛡️ Admin Dashboard - `apps/admin`

Đây là bảng điều khiển quản trị trung tâm dành cho người dùng Merchant (Chủ shop) và Super Admin. Ứng dụng này cung cấp giao diện trực quan để quản lý mọi khía cạnh của một hệ thống SaaS e-commerce.

---

## 🌟 Chức năng chính

### 1. Quản lý Tenant (Shops)
*   **Đăng ký và cấu hình domain**: Tạo shop mới và gắn tên miền riêng.
*   **Trạng thái hoạt động**: Kích hoạt hoặc tạm ngưng các cửa hàng.

### 2. Thiết kế Giao diện (Visual Layout Builder)
Đây là công cụ quan trọng nhất của Admin:
*   **Kéo thả Block**: Thay đổi cấu trúc giao diện Storefront mà không cần code.
*   **Preview**: Xem trước thay đổi theo thời gian thực trước khi `Publish` lên Database.

### 3. Quản lý thương mại
*   **Sản phẩm & Tồn kho**: Quản lý danh mục, SKU, biến thể sản phẩm.
*   **Đơn hàng**: Theo dõi quy trình xử lý đơn hàng và thanh toán.
*   **Khách hàng**: Quản lý danh sách thành viên và phân phối voucher.

### 4. Báo cáo & Phân tích
*   **Analytics Dashboard**: Tổng số đơn hàng, doanh thu, tỉ lệ chuyển đổi qua các biểu đồ động.

---

## 🏗️ Công nghệ sử dụng
*   **Next.js 15 (App Router)**: Framework nền tảng.
*   **Better Auth**: Quản lý phiên làm việc và phân quyền.
*   **React Hook Form & Zod**: Xử lý form và validate dữ liệu chặt chẽ.
*   **Recharts**: Thư viện vẽ biểu đồ phân tích.

---

## 🛠️ Phát triển Local
Để chạy ứng dụng admin độc lập:
```bash
npm run dev
```
Truy cập qua: `http://localhost:5200` (mặc định cho admin).

---

> [!TIP]
> Các cấu hình layout được lưu trực tiếp vào MongoDB dưới dạng JSON diff để đảm bảo tính nhẹ nhàng và linh hoạt của hệ thống Zero-file.
