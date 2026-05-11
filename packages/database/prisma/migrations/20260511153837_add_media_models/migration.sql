-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blurHash" TEXT,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_usage" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "usedBytes" BIGINT NOT NULL DEFAULT 0,
    "totalLimit" BIGINT NOT NULL DEFAULT 1073741824,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_shopId_idx" ON "media"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "storage_usage_shopId_key" ON "storage_usage"("shopId");

-- CreateIndex
CREATE INDEX "storage_usage_shopId_idx" ON "storage_usage"("shopId");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_usage" ADD CONSTRAINT "storage_usage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
