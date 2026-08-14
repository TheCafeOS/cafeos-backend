-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'TABLES_MERGED';
ALTER TYPE "AuditAction" ADD VALUE 'TABLES_UNMERGED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "mergeId" TEXT;

-- CreateTable
CREATE TABLE "TableMerge" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableMerge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableMergeTable" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "mergeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableMergeTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableMerge_restaurantId_isActive_idx" ON "TableMerge"("restaurantId", "isActive");

-- CreateIndex
CREATE INDEX "TableMerge_restaurantId_createdAt_idx" ON "TableMerge"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "TableMergeTable_restaurantId_tableId_idx" ON "TableMergeTable"("restaurantId", "tableId");

-- CreateIndex
CREATE INDEX "TableMergeTable_restaurantId_mergeId_idx" ON "TableMergeTable"("restaurantId", "mergeId");

-- CreateIndex
CREATE INDEX "TableMergeTable_tableId_idx" ON "TableMergeTable"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "TableMergeTable_mergeId_tableId_key" ON "TableMergeTable"("mergeId", "tableId");

-- CreateIndex
CREATE INDEX "Order_mergeId_idx" ON "Order"("mergeId");

-- AddForeignKey
ALTER TABLE "TableMerge" ADD CONSTRAINT "TableMerge_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableMergeTable" ADD CONSTRAINT "TableMergeTable_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableMergeTable" ADD CONSTRAINT "TableMergeTable_mergeId_fkey" FOREIGN KEY ("mergeId") REFERENCES "TableMerge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableMergeTable" ADD CONSTRAINT "TableMergeTable_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_mergeId_fkey" FOREIGN KEY ("mergeId") REFERENCES "TableMerge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
