-- Guest cart support
-- Hand-written migration (deploy via session pooler, port 5432)
--
-- Allows anonymous (guest) carts keyed by a cookie token, merged into the
-- customer's cart on login. customerId becomes nullable; a new guestToken
-- column holds the anonymous session id. Postgres allows multiple NULLs in a
-- unique index, so guest carts (customerId NULL) and customer carts
-- (guestToken NULL) coexist without collision.

-- AlterTable: customerId nullable + add guestToken
ALTER TABLE "carts" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "guestToken" TEXT;

-- CreateIndex: one guest cart per (shop, guest token)
CREATE UNIQUE INDEX IF NOT EXISTS "carts_shopId_guestToken_key" ON "carts"("shopId", "guestToken");
