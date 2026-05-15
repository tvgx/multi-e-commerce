/*
  Warnings:

  - A unique constraint covering the columns `[shopId,type]` on the table `payment_methods` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_shopId_type_key" ON "payment_methods"("shopId", "type");
