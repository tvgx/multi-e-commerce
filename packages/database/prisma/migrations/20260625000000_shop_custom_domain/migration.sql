-- P0-2: Custom domain thật cho shop (xác thực qua bản ghi TXT + routing storefront)
-- Hand-written migration (deploy via session pooler, port 5432)
--
-- `domain` vẫn là slug định danh storefront ([shopSlug]); `customDomain` là tên
-- miền riêng người bán trỏ về và được xác thực. `domainVerified` đã tồn tại.

ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "shops_customDomain_key" ON "shops"("customDomain");
