# 🧠 Shared Schema - `packages/schema`

Đây là "Nguồn sự thật duy nhất" (Single Source of Truth) để định nghĩa mọi cấu trúc dữ liệu chung trong toàn bộ monorepo. Nó sử dụng **Zod** để đảm bảo tính nhất quán giữa API, Storefront và Database.

---

## 🏗️ Vì sao dùng Shared Schema?

*   **Đảm bảo tính hợp lệ**: Một thuộc tính layout trong MongoDB phải đúng với định dạng mà frontend yêu cầu.
*   **Chia sẻ Types**: Dụng chung kiểu dữ liệu (Interfaces/Types) cho NestJS và Next.js mà không cần khai báo lặp lại.
*   **Dự đoán Lỗi**: Phát hiện lỗi ngay từ khi viết code nếu truyền sai props cho một component UI dynamic.

---

## 📦 Danh mục Schema

Hiện có các nhóm schema chính:
*   **Shop Schema**: Định nghĩa cấu trúc Metadata của một shop.
*   **Layout Schema**: Định nghĩa `ComponentNode`, `ThemeConfig`, `LayoutConfig`.
*   **Order/Product Schema**: Các quy chuẩn cho dữ liệu giao dịch và hàng hóa.

---

## 🛠️ Cách sử dụng

```tsx
import { LayoutSchema } from "@ecommerce/schema";

// Validate dữ liệu từ một API hoặc file JSON
const result = LayoutSchema.safeParse(data);
if (!result.success) {
  console.error("Layout JSON không hợp lệ:", result.error);
}
```

---

## ⚡ Lưu ý cho Lập trình viên
*   Khi bạn thay đổi Schema ở đây, hãy nhớ chạy `npm run check-types` ở root để kiểm tra xem có ứng dụng nào bị ảnh hưởng không.
*   Mọi thay đổi trong `packages/schema` nên được cập nhật đồng thời vào các script sync layout trong `apps/cli-tool`.
