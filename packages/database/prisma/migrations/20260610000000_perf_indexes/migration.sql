-- CreateIndex
CREATE INDEX "products_shopId_createdAt_idx" ON "products"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "products_shopId_status_idx" ON "products"("shopId", "status");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "stock_movements_orderId_idx" ON "stock_movements"("orderId");

-- CreateIndex
CREATE INDEX "orders_shopId_createdAt_idx" ON "orders"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_shopId_state_idx" ON "orders"("shopId", "state");

-- CreateIndex
CREATE INDEX "line_items_variantId_idx" ON "line_items"("variantId");

