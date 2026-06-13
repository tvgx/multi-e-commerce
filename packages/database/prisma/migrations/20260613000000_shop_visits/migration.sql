-- Tracking lượt ghé shop cho analytics (conversion rate, funnel).
-- Mỗi row ≈ một phiên ghé (dedup 30 phút theo visitorId phía API).
-- Không FK sang shops/customers — bảng log ghi nhanh, không cần cascade.

-- CreateTable
CREATE TABLE "shop_visits" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "customerId" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_visits_shopId_createdAt_idx" ON "shop_visits"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "shop_visits_shopId_visitorId_createdAt_idx" ON "shop_visits"("shopId", "visitorId", "createdAt");
