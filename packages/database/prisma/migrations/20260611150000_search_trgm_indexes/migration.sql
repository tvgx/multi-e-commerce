-- Product search (findAllProducts) lọc bằng ILIKE '%term%' trên name/description/sku.
-- B-tree không dùng được cho contains-match nên mỗi search là một seq scan;
-- pg_trgm + GIN cho phép Postgres dùng index cho các điều kiện này.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_description_idx" ON "products" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants" USING GIN ("sku" gin_trgm_ops);
