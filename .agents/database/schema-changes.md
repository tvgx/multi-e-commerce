# Schema Changes (Prisma)

1. Sửa/thêm file model trong `packages/database/prisma/models/*.prisma` (mỗi domain 1 file: `shop`, `order`, `product`, `payment`, `cart`, `inventory`, `promotion`, `shipping`, `wallet`, `media`, `notifications`, `interactions`, `geo`, `analytics`, `content`, `auth`).
2. **File model MỚI**: thêm tên vào `MODEL_FILES` trong `build-prisma-schema.js` — không thì bị bỏ qua khi ghép schema.
3. Chạy build schema + `prisma generate` (`packages/database` re-export client).
4. Viết SQL migration **bằng tay** (xem [migrations.md](migrations.md)) — kèm cả phần rollback.
5. Đổi phải **backward-compatible** (code cũ chạy được với schema mới).
6. Test local → staging (bản sao dữ liệu prod) → prod. Ước lượng downtime.
7. PR gồm cả thay đổi schema + code + SQL migration.

> MongoDB (layout/chat): schema Mongoose trong `apps/api-core/src/database/schemas` & module tương ứng — không qua Prisma.
