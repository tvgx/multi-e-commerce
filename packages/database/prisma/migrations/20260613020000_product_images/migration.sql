-- Sản phẩm nhiều ảnh: lưu đủ mảng URL (MinIO shop-public/<shopId>/<productId>-N).
-- imageUrl giữ lại làm ảnh đại diện (= images[0]) cho code cũ.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: sản phẩm đã có ảnh đại diện thì đưa vào mảng
UPDATE "products" SET "images" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';
