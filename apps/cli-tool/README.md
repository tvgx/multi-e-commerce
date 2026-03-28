# 🛠️ E-commerce CLI Tool - `apps/cli-tool`

Đây là bộ công cụ dòng lệnh (CLI) giúp lập trình viên và quản trị viên tương tác với hệ thống SaaS Engine một cách nhanh chóng. Công cụ này hỗ trợ đồng bộ hóa layout, quản lý template và tự động hóa các tác vụ lặp đi lặp lại.

---

## 🚀 Các lệnh chính

### 1. Đồng bộ Layout (`sync:layout`)
Lệnh này dùng để đẩy cấu hình layout từ file local (thường là `layout.config.ts`) lên MongoDB của một shop cụ thể.
```bash
npm run sync:layout --shop-id=<ID_CUA_HANG>
```

### 2. Theo dõi thay đổi (`watch:layout`)
Tự động đồng bộ hóa mỗi khi bạn lưu file cấu hình layout. Rất hữu ích trong quá trình phát triển giao diện.
```bash
npm run watch:layout --shop-id=<ID_CUA_HANG>
```

### 3. Khởi tạo Template (`generate:master`)
Tạo một bản blueprint mẫu cho một ngành hàng mới.
```bash
npm run generate:master --industry=<fashion|electronics|home|food>
```

---

## 🏗️ Cấu trúc công cụ
*   **Node.js/TypeScript**: Sử dụng `tsx` để thực thi trực tiếp các script đồng bộ.
*   **Socket.io Client**: (Nâng cao) Hỗ trợ cập nhật giao diện thời gian thực trên Storefront khi có thay đổi từ CLI.
*   **Zod**: Đảm bảo dữ liệu trước khi đẩy lên Database phải luôn đúng định dạng Schema chung.

---

## 💡 Lưu ý quan trọng
*   Luôn đảm bảo bạn đã cấu hình đúng `MONGO_DB_ATLAS` trong file `.env` ở thư mục gốc trước khi chạy lệnh sync.
*   Nếu có lỗi về Schema, hãy kiểm tra lại `packages/schema` để biết các thuộc tính nào là bắt buộc.
