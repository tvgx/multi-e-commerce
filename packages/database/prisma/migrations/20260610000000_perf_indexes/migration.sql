-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_shopId_createdAt_idx" ON "products"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_shopId_status_idx" ON "products"("shopId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
-- Guarded: the deployed DB's 20260519174341_optimize_schema_3nf migration (not in
-- this repo) dropped stock_movements; create the index only where the table exists.
DO $$ BEGIN
  IF to_regclass('public.stock_movements') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "stock_movements_orderId_idx" ON "stock_movements"("orderId");
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_shopId_createdAt_idx" ON "orders"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_shopId_state_idx" ON "orders"("shopId", "state");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "line_items_variantId_idx" ON "line_items"("variantId");
