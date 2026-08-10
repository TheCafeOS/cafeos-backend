-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerIp" TEXT;

-- CreateIndex
CREATE INDEX "Order_tableId_customerIp_status_idx" ON "Order"("tableId", "customerIp", "status");
