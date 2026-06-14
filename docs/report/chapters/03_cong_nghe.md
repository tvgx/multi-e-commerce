# Chương 3 — Công nghệ sử dụng

> Mỗi công nghệ: giải quyết yêu cầu nào ở Chương 2, các lựa chọn thay thế, lý do chọn. Khi chuyển sang LaTeX, thêm `\cite{}` và mục `.bib` cho mỗi công nghệ.

## 3.1 NestJS (backend, `apps/api-core`)
- **Giải quyết**: cần backend module hóa, đa tenant, dễ kiểm thử cho toàn bộ nghiệp vụ (§2.3, §2.4).
- **Thay thế**: Express thuần, Fastify, Spring Boot.
- **Lý do**: cấu trúc module/dependency-injection rõ ràng, hệ guard/interceptor hỗ trợ tốt việc cô lập tenant và phân quyền, tích hợp sẵn với TypeScript và Swagger. Lưu ý thiết kế: dự án không dùng global ValidationPipe (validate trong service) và bọc mọi phản hồi trong `BaseResponseDto`.

## 3.2 Prisma trên PostgreSQL (dữ liệu nghiệp vụ)
- **Giải quyết**: lưu trữ có cấu trúc, quan hệ chặt (shop, sản phẩm, đơn, thanh toán, tồn kho — §2.3).
- **Thay thế**: TypeORM, Sequelize, Knex.
- **Lý do**: schema khai báo rõ ràng, type-safe, sinh client tự động. Trong dự án, schema được tách theo domain trong `packages/database/prisma/models/*.prisma` và ghép qua `build-prisma-schema.js`; migration viết tay, deploy qua session pooler.

## 3.3 Mongoose trên MongoDB (cấu hình giao diện)
- **Giải quyết**: lưu cấu hình giao diện dạng JSON linh hoạt cho builder và kết xuất động (§2.2, UC-2).
- **Thay thế**: lưu JSON trong cột `jsonb` của PostgreSQL.
- **Lý do**: schema mềm dẻo phù hợp cây component thay đổi liên tục; tách `draftData`/`publishedData` thuận tiện cho luồng nháp–xuất bản. (MongoDB chỉ dùng cho `layout` và `chat`.)

## 3.4 Next.js (admin & storefront)
- **Giải quyết**: trang quản trị giàu tương tác (builder kéo–thả) và storefront kết xuất động, nhẹ (§2.2, UC-2, UC-4).
- **Thay thế**: React SPA + Vite, Remix, Nuxt.
- **Lý do**: App Router + Server Components giảm bundle phía client, hỗ trợ kết xuất từ JSON theo từng tenant mà không build lại mã cho mỗi gian hàng.

## 3.5 Hàng đợi Bull trên Redis (tác vụ nền)
- **Giải quyết**: tách tác vụ nặng khỏi luồng request — dựng/xuất bản gian hàng, gửi email, xử lý thanh toán (§2.4, UC-1, UC-4).
- **Thay thế**: BullMQ, RabbitMQ, xử lý đồng bộ trong request.
- **Lý do**: hàng đợi dựa trên Redis nhẹ, có sẵn worker độc lập (`shop-build`), phù hợp tài nguyên hạn chế. Redis đồng thời làm cache.

## 3.6 better-auth (xác thực)
- **Giải quyết**: xác thực người bán và phân quyền theo vai trò OWNER/ADMIN (§2.3, §2.4).
- **Thay thế**: Passport.js + JWT tự quản, Auth0.
- **Lý do**: tích hợp gọn với NestJS qua guard, quản lý phiên và adapter Prisma sẵn có; người mua dùng cơ chế xác thực storefront riêng.

## 3.7 MinIO / AWS S3 SDK (lưu trữ ảnh)
- **Giải quyết**: lưu ảnh sản phẩm và ảnh giao diện (§2.3, UC-3).
- **Thay thế**: lưu file hệ thống, Cloudinary.
- **Lý do**: tương thích S3, tự vận hành được trên hạ tầng cá nhân; ba bucket tách biệt (ảnh giao diện, ảnh công khai, nội bộ).

## 3.8 Turborepo (monorepo)
- **Giải quyết**: quản lý nhiều app/package dùng chung, build nhanh (§2.4 bảo trì).
- **Thay thế**: Nx, Lerna, npm workspaces thuần.
- **Lý do**: điều phối task (build/lint/test) song song theo thứ tự phụ thuộc và cache kết quả; khác với git (quản lý phiên bản), Turbo chỉ điều phối build. Component dùng chung ở `packages/ui-registry`, schema ở `packages/schema`.

## 3.9 Zod, socket.io, Tailwind (bổ trợ)
- **Zod** (`packages/schema`): nguồn sự thật cho schema JSON layout, validate dữ liệu (§2.2). Thay thế: class-validator, Yup.
- **socket.io**: chat tư vấn real-time (use-case phụ). Thay thế: WebSocket thuần, SSE.
- **Tailwind CSS**: dựng giao diện nhất quán cho admin/storefront. Thay thế: CSS Modules, styled-components.
