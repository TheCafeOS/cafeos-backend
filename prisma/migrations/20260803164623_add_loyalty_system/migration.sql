-- CreateEnum
CREATE TYPE "LoyaltyRewardStatus" AS ENUM ('AVAILABLE', 'REDEEMED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "purchaseThreshold" INTEGER NOT NULL,
    "rewardQuantity" INTEGER NOT NULL DEFAULT 1,
    "minimumOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCustomer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "progressCount" INTEGER NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "programId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" "LoyaltyRewardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_restaurantId_key" ON "LoyaltyProgram"("restaurantId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_restaurantId_isActive_idx" ON "LoyaltyProgram"("restaurantId", "isActive");

-- CreateIndex
CREATE INDEX "LoyaltyCustomer_restaurantId_phone_idx" ON "LoyaltyCustomer"("restaurantId", "phone");

-- CreateIndex
CREATE INDEX "LoyaltyCustomer_restaurantId_progressCount_idx" ON "LoyaltyCustomer"("restaurantId", "progressCount");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCustomer_restaurantId_phone_key" ON "LoyaltyCustomer"("restaurantId", "phone");

-- CreateIndex
CREATE INDEX "LoyaltyReward_restaurantId_customerId_status_idx" ON "LoyaltyReward"("restaurantId", "customerId", "status");

-- CreateIndex
CREATE INDEX "LoyaltyReward_programId_status_idx" ON "LoyaltyReward"("programId", "status");

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCustomer" ADD CONSTRAINT "LoyaltyCustomer_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "LoyaltyCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "LoyaltyCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
