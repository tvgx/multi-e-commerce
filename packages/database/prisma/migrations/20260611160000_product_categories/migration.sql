-- Bảng categories: danh mục sản phẩm dạng cây, riêng theo shop.
-- products.categoryId đã tồn tại từ trước nhưng không trỏ vào bảng nào;
-- migration này tạo bảng đích và thêm FK (SET NULL khi xoá danh mục).

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_shopId_slug_key" ON "categories"("shopId", "slug");

-- CreateIndex
CREATE INDEX "categories_shopId_idx" ON "categories"("shopId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- categoryId cũ là text tự do (chưa từng có bảng đích) — nullify giá trị mồ côi
-- trước khi thêm FK, nếu không ALTER TABLE sẽ fail.
UPDATE "products" SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND "categoryId" NOT IN (SELECT "id" FROM "categories");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
