---
trigger: always_on
---

# Quy tắc dự án — multi-ecommerce (cho người & AI agent)

Đây là **SaaS Engine** đa tenant, KHÔNG phải website đơn lẻ.

## 1. Zero-File Doctrine
- **Cấm** tạo file `.tsx`/`.page.tsx` riêng cho từng tenant.
- Component UI dùng chung ở `packages/ui-registry` (admin builder & storefront cùng lấy từ đây — admin KHÔNG import trực tiếp từ storefront).
- `MasterTemplate` (MongoDB) = cấu trúc mặc định; `TenantLayout` (MongoDB) = JSON override (chỉ lưu phần thay đổi).
- `storefront` nhận `shopId` → gọi API lấy JSON layout → Dynamic Component Resolver render.

## 2. Tech stack & vị trí
- `apps/api-core` (NestJS 11): Prisma→PostgreSQL (shop/order/product...), Mongoose→MongoDB (layout, chat). Đa tenant qua tenant context (header `x-shop-id`).
- `apps/storefront` (Next.js App Router): Server Components mặc định, Tailwind, lucide-react.
- `packages/schema` (Zod): nguồn sự thật cho JSON Layout.
- `packages/ui-registry`: component dùng chung (hỗ trợ `className` qua `cn()`).

## 3. Ràng buộc tài nguyên (máy 16GB, WSL2)
Tránh memory-leak, đóng kết nối DB, dùng Stream cho tác vụ lớn, giới hạn pool size.

## 4. CLI & sync
Sửa layout → nhắc chạy `npm run sync:layout` (đẩy vào MongoDB). Tạo template: `npm run generate:master --industry=<type>`.

## 5. Coding standards
- Validate I/O API bằng Zod schema.
- **Response phải bọc `BaseResponseDto`** (không trả raw). API-core **không có** global ValidationPipe → validate tay trong service.
- `shopId` qua header `x-shop-id`, KHÔNG qua body.
- Naming: biến/hàm `camelCase`, class/component `PascalCase`, file `kebab-case`. Ưu tiên `interface`. **Cấm `any`**.

## 6. Không quick-fix
Cấm hardcode URL/credentials/config, bỏ qua `BaseResponseDto`, tắt guard/validation "để test", tạo stub không implement thật. Hỏi: *"Giải pháp này còn đúng sau 6 tháng khi scale & người khác maintain không?"* — Không → dừng, làm đúng. Chi tiết: [core-rules/principles.md — Nguyên tắc 9](../core-rules/principles.md).

## 7. Giao tiếp (vibe-coding)
Trước khi code: tóm tắt sẽ sửa schema ở package nào, render ở app nào. Cảnh báo ngay nếu yêu cầu phá vỡ multi-tenant hoặc tăng RAM đột biến. Chia nhỏ thành bước kiểm chứng được, không đổ 500 dòng một lần.
