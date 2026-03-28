# 🎨 UI Registry & Library - `packages/ui-registry`

Đây là thư viện UI tập trung của toàn bộ hệ thống SaaS, được xây dựng dựa trên **shadcn/ui** và **Radix UI**. Đây là "nguồn sự thật duy nhất" cho mọi thành phần giao diện được sử dụng bởi các Storefront Engines.

---

## 🏗️ Nguyên tắc phát triển

### 1. Zero-File Compatibility
Mọi component trong thư viện này phải được thiết kế để có thể cấu hình hoàn toàn qua JSON:
*   **Props-driven**: Các thuộc tính như màu sắc, nội dung, kích thước phải được truyền qua `props`.
*   **Atomic Design**: Chia nhỏ label, button, card để tái sử dụng tối đa.

### 2. Styling Standards
Sử dụng **Tailwind CSS** kết hợp với tiện ích `cn()`:
```tsx
import { cn } from "@/lib/utils";

export const Button = ({ className, ...props }) => (
  <button className={cn("px-4 py-2 bg-blue-500", className)} {...props} />
);
```

---

## 📦 Danh mục Components

Thư viện hiện có các nhóm chính:
*   **Layout**: Header, Footer, Sidebar, Container.
*   **Forms**: Input, Checkbox, Select, DatePicker.
*   **Data Display**: ProductCard, PriceTag, Badge, Accordion.
*   **Feedback**: Toast, Dialog, Skeleton, Progress.

---

## 🛠️ Hướng dẫn sử dụng & Mở rộng

1.  **Thêm Component mới**: 
    Sử dụng lệnh `npx shadcn-ui@latest add <component-name>` (nếu muốn import từ shadcn) hoặc tạo thủ công trong thư mục `src/components`.
2.  **Đăng ký Type**:
    Đừng quên khai báo kiểu dữ liệu cho component mới tại `packages/schema` để hệ thống layout có thể validate đúng.

---

## ⚡ Hiệu năng
*   Sử dụng **Lucide React** cho icon để đảm bảo tính gọn nhẹ.
*   Tối ưu hóa các hiệu ứng animation bằng **Framer Motion**.
