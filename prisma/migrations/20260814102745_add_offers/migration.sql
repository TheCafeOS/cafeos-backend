/*
  Warnings:

  - The existing Order.mergeId column is renamed to tableMergeId
    so existing table-merge relationships are preserved.
  - Existing orders are backfilled with subtotal = total because
    the discount system did not exist for those orders.
*/

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- Remove the old merge foreign key and index before renaming the column
ALTER TABLE "Order"
DROP CONSTRAINT IF EXISTS "Order_mergeId_fkey";

DROP INDEX IF EXISTS "Order_mergeId_idx";

-- Rename the existing merge relationship column instead of dropping it.
-- This preserves all existing table merge data.
ALTER TABLE "Order"
RENAME COLUMN "mergeId" TO "tableMergeId";

-- Add the new offer-related columns.
ALTER TABLE "Order"
ADD COLUMN "appliedOfferId" TEXT,
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add subtotal temporarily as nullable so existing orders can be backfilled.
ALTER TABLE "Order"
ADD COLUMN "subtotal" DECIMAL(10,2);

-- Existing orders never had discounts, so their subtotal equals their total.
UPDATE "Order"
SET "subtotal" = "total"
WHERE "subtotal" IS NULL;

-- Now that every existing order has a subtotal,
-- make the column required.
ALTER TABLE "Order"
ALTER COLUMN "subtotal" SET NOT NULL;

-- Create Offer table
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minimumOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maximumDiscount" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- Offer indexes
CREATE INDEX "Offer_restaurantId_idx"
ON "Offer"("restaurantId");

CREATE INDEX "Offer_restaurantId_isActive_idx"
ON "Offer"("restaurantId", "isActive");

CREATE INDEX "Offer_restaurantId_startsAt_endsAt_idx"
ON "Offer"("restaurantId", "startsAt", "endsAt");

-- Order applied-offer index
CREATE INDEX "Order_restaurantId_appliedOfferId_idx"
ON "Order"("restaurantId", "appliedOfferId");

-- Restore the table-merge index using the new column name
CREATE INDEX "Order_tableMergeId_idx"
ON "Order"("tableMergeId");

-- Add Offer relationship
ALTER TABLE "Order"
ADD CONSTRAINT "Order_appliedOfferId_fkey"
FOREIGN KEY ("appliedOfferId")
REFERENCES "Offer"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add table merge relationship
ALTER TABLE "Order"
ADD CONSTRAINT "Order_tableMergeId_fkey"
FOREIGN KEY ("tableMergeId")
REFERENCES "TableMerge"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add Offer -> Restaurant relationship
ALTER TABLE "Offer"
ADD CONSTRAINT "Offer_restaurantId_fkey"
FOREIGN KEY ("restaurantId")
REFERENCES "Restaurant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;