# api-core — Backend đa tenant

**Stack**: NestJS 11, Prisma/PostgreSQL (dữ liệu chính) + Mongoose/MongoDB (chỉ `layout` & `chat`), Bull/Redis (queue `build`, `email`, `payment`), better-auth, AWS-S3 SDK→MinIO, socket.io, Swagger. Dev cổng **3000** (`npm run dev`).

Phục vụ admin, storefront, cli-tool. Đa tenant: hầu hết truy vấn gắn `shopId` (tenant context / header `x-shop-id` / path).

## Quy ước quan trọng (dễ sai)

- **Prefix `/api`** (`setGlobalPrefix('api')`) — route là `/api/<controller>`. Controller dùng số nhiều (`shops`, `orders`...).
- **Response envelope** `{ code, message, data }` (`BaseResponseDto`), `code "1000"` = OK. KHÔNG có interceptor bọc → controller phải tự `BaseResponseDto.success()`, quên thì UI trắng.
- **Không có global ValidationPipe** → validate tay trong service (DTO decorators không tự chạy).
- Bảng mã response: [response-codes.constant.ts](../../../apps/api-core/src/common/constants/response-codes.constant.ts) → tổng hợp ở [api-doc/README](../../../api-doc/README.md).

## Module (`src/modules/*`)

shop · catalog (product/category/option-type/storefront) · cart · order · payment · shipping · promotions · inventory · layout · build · media · analytics · auth · storefront-auth · customer-address · wallet · interactions · chat · notifications · geo · templates · email.

→ Endpoint chi tiết từng module: [api-doc](../../../api-doc/). Phần `apis/` ở đây chỉ là tóm tắt.

Test `npm run test` (jest). Lint `npm run lint`. Build `npm run build` (tsc).
