# 📋 Master Templates - `packages/master-templates`

Đây là "kho tàng" các mẫu giao diện (Blueprints) cho từng ngành hàng. Khi một shop mới được tạo ra, hệ thống sẽ sao chép cấu hình từ templates ở đây để làm điểm khởi đầu cho cửa hàng đó.

---

## 🏗️ Cấu trúc Template

Mỗi template là một file JSON định nghĩa:
*   **Nodes**: Danh sách các thành phần UI (Header, Banner, ProductGrid,...) theo thứ tự render.
*   **Theme**: Cấu hình màu sắc, font chữ chung cho toàn bộ shop.

Các templates hiện có:
*   `fashion.json`: Chuyên cho ngành thời trang, mỹ phẩm.
*   `electronics.json`: Chuyên cho điện máy, gia dụng.
*   `general.json`: Mẫu đa dụng phù hợp với nhiều loại hình kinh doanh.

---

## 🛠️ Cách cập nhật Template

1.  **Thay đổi JSON**: Chỉnh sửa trực tiếp các file trong `src/templates/`.
2.  **Đồng bộ hẹ thống**: Sau khi sửa, hãy chạy lệnh CLI `npm run generate:master --industry=<type>` để cập nhật bản demo hoặc Master Template trong MongoDB.

---

## ⚡ Ưu điểm của kiến trúc Blueprint
*   **Khởi tạo nhanh**: Chỉ mất 1 request để cấu hình đầy đủ giao diện cho shop mới.
*   **Dễ dàng bảo trì**: Nếu bạn bổ sung một banner mới vào `fashion.json`, các shop mới tiếp theo sẽ tự động có banner đó.
