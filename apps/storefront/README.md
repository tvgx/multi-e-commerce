# 🎨 Storefront Engine - `apps/storefront`

Đây là **Storefront Engine** của hệ thống, được xây dựng bằng **Next.js 15 (App Router)**. Khác với các website thông thường, ứng dụng này hoạt động như một bộ máy render động dựa trên cấu hình JSON.

---

## ⚙️ Cơ chế hoạt động (The Engine)

Storefront không chứa các trang (`.tsx`) cố định cho từng shop. Thay vào đó, nó tuân theo quy trình:

1.  **Middleware Domain Detection**: Nhận diện `tenantId` (hoặc shop domain) từ request URL.
2.  **Layout Fetching**: Gọi API tới `api-core` để lấy bản compiled JSON Layout (đã được merge từ Master Template và Tenant Overrides).
3.  **Dynamic Component Resolver**:
    *   Duyệt qua danh sách các `nodes` trong JSON.
    *   Ánh xạ `componentType` (vd: `Header`, `ProductGrid`, `Banner`) với các React Components thực tế trong `packages/ui-library`.
    *   Render giao diện hoàn chỉnh với các thuộc tính (`props`) được định nghĩa trong JSON.

---

## 🛠️ Hướng dẫn cho Lập trình viên

### 1. Thêm một Component mới
Nếu bạn muốn thêm một thành phần giao diện mới (ví cả dụ: `CountdownTimer`):
1.  **Tạo Component**: Viết code tại `packages/ui-library/src/components/`.
2.  **Đăng ký Registry**: Cập nhật file `component-registry.ts` trong `storefront` để ánh xạ key `CountdownTimer` với component vừa tạo.
3.  **Cập nhật Schema**: Thêm định nghĩa props cho component này vào `packages/schema`.

### 2. Phát triển Local
Chạy riêng storefront (yêu cầu `api-core` đang chạy):
```bash
npm run dev
```
Truy cập qua domain local (ví dụ: `shop1.localhost:3000`).

---

## 🎨 Styling & UI
*   **Tailwind CSS**: Sử dụng cho toàn bộ styling.
*   **Lucide React**: Thư viện icon mặc định.
*   **Framer Motion**: Sử dụng cho các hiệu ứng chuyển cảnh và micro-animations.

---

## ⚡ Tối ưu hóa Hiệu năng
*   **Server Components**: Hầu hết các thành phần layout là Server Components để giảm bundle size client.
*   **Image Optimization**: Sử dụng `next/image` để tự động tối ưu hóa hình ảnh sản phẩm.
*   **Streaming**: Sử dụng `Suspense` để render các block dữ liệu chậm (như danh sách sản phẩm gợi ý) mà không làm chậm toàn bộ trang.

---

> [!IMPORTANT]
> Tuyệt đối **KHÔNG** tạo các file `.page.tsx` cứng cho từng shop. Mọi thay đổi về cấu trúc trang phải được thực hiện thông qua JSON Layout.

