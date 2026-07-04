/*
  Warnings:

  - A unique constraint covering the columns `[qrCode]` on the table `RestaurantTable` will be added. If there are existing duplicate values, this will fail.
  - Made the column `qrCode` on table `RestaurantTable` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RestaurantTable" ALTER COLUMN "qrCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_qrCode_key" ON "RestaurantTable"("qrCode");
