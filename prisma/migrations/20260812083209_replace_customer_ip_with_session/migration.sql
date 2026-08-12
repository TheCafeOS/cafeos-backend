/*
  Warnings:

  - You are about to drop the column `customerIp` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_tableId_customerIp_status_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "customerIp",
ADD COLUMN     "customerSessionId" TEXT;

-- CreateIndex
CREATE INDEX "Order_tableId_customerSessionId_status_idx" ON "Order"("tableId", "customerSessionId", "status");
