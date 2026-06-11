-- Shipping & Wallet features
-- Hand-written migration (deploy via session pooler, port 5432)

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_methods" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeThreshold" DOUBLE PRECISION,
    "estimatedDays" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shippingMethodId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "note" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wallets" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wallet_topup_requests" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_topup_requests_pkey" PRIMARY KEY ("id")
);

-- AlterTable: orders — shipping method + snapshot địa chỉ giao hàng
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingMethodId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "recipientName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "recipientPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCity" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingProvince" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingNote" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_methods_shopId_idx" ON "shipping_methods"("shopId");
CREATE INDEX IF NOT EXISTS "shipments_orderId_idx" ON "shipments"("orderId");
CREATE INDEX IF NOT EXISTS "shipments_shopId_state_idx" ON "shipments"("shopId", "state");
CREATE UNIQUE INDEX IF NOT EXISTS "wallets_customerId_key" ON "wallets"("customerId");
CREATE INDEX IF NOT EXISTS "wallets_shopId_idx" ON "wallets"("shopId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");
CREATE INDEX IF NOT EXISTS "wallet_transactions_shopId_createdAt_idx" ON "wallet_transactions"("shopId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_topup_requests_token_key" ON "wallet_topup_requests"("token");
CREATE INDEX IF NOT EXISTS "wallet_topup_requests_shopId_status_idx" ON "wallet_topup_requests"("shopId", "status");
CREATE INDEX IF NOT EXISTS "wallet_topup_requests_walletId_idx" ON "wallet_topup_requests"("walletId");

-- AddForeignKey (bọc trong DO block để chạy lại không lỗi duplicate)
DO $$ BEGIN
  ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "wallets" ADD CONSTRAINT "wallets_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "wallets" ADD CONSTRAINT "wallets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "wallet_topup_requests" ADD CONSTRAINT "wallet_topup_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
