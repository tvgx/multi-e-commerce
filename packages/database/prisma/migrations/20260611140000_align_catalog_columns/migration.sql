-- Align catalog tables with the repo schema (remaining drift from the
-- out-of-repo 3NF migration): product_variants.shopId, products.imageUrl,
-- and per-shop unique indexes for sku/slug/promo code.
-- Hand-written migration (deploy via session pooler, port 5432).

-- products.imageUrl
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- product_variants.shopId — thêm nullable, backfill từ products, rồi mới NOT NULL
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "shopId" TEXT;

UPDATE "product_variants" pv
SET "shopId" = p."shopId"
FROM "products" p
WHERE pv."productId" = p."id" AND pv."shopId" IS NULL;

ALTER TABLE "product_variants" ALTER COLUMN "shopId" SET NOT NULL;

-- Unique sku/slug/code chuyển từ global sang per-shop (multi-tenant)
DROP INDEX IF EXISTS "product_variants_sku_key";
DROP INDEX IF EXISTS "products_slug_key";
DROP INDEX IF EXISTS "promotions_code_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_shopId_idx" ON "product_variants"("shopId");
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_shopId_sku_key" ON "product_variants"("shopId", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "products_shopId_slug_key" ON "products"("shopId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "promotions_shopId_code_key" ON "promotions"("shopId", "code");

-- AddForeignKey (bọc trong DO block để chạy lại không lỗi duplicate)
DO $$ BEGIN
  ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
