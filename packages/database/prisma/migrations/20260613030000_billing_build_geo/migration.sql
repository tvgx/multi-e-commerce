-- Billing & Shipping wizard + background shop-build worker + VN admin geo data
-- Hand-written migration (deploy via session pooler, port 5432)

-- CreateTable: shop_build_jobs (theo dõi tiến độ build nền)
CREATE TABLE IF NOT EXISTS "shop_build_jobs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "jobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "percent" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT,
    "error" TEXT,
    "storefrontUrl" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_build_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: provinces (tỉnh/thành sau sáp nhập)
CREATE TABLE IF NOT EXISTS "provinces" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("code")
);

-- CreateTable: wards (phường/xã — bỏ cấp quận/huyện)
CREATE TABLE IF NOT EXISTS "wards" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceCode" TEXT NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("code")
);

-- AlterTable: stock_locations — địa chỉ kho hàng (nơi shipper đến lấy hàng)
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "addressLine" TEXT;
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "provinceCode" TEXT;
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "wardCode" TEXT;
ALTER TABLE "stock_locations" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shop_build_jobs_shopId_createdAt_idx" ON "shop_build_jobs"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "wards_provinceCode_idx" ON "wards"("provinceCode");

-- AddForeignKey (bọc trong DO block để chạy lại không lỗi duplicate)
DO $$ BEGIN
  ALTER TABLE "wards" ADD CONSTRAINT "wards_provinceCode_fkey" FOREIGN KEY ("provinceCode") REFERENCES "provinces"("code") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
