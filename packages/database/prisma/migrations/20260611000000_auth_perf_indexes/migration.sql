-- CreateIndex
CREATE INDEX IF NOT EXISTS "shops_ownerId_idx" ON "shops"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_shopId_createdAt_idx" ON "customers"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_accounts_customerId_idx" ON "customer_accounts"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_verifications_identifier_idx" ON "customer_verifications"("identifier");
