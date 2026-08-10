/*
  Multiple loyalty programs per restaurant
  Safely migrates existing customer loyalty progress.
*/

-- Drop the old customer -> single program relationship first.
ALTER TABLE "LoyaltyCustomer"
DROP CONSTRAINT "LoyaltyCustomer_programId_fkey";

-- Drop old indexes/unique constraint.
DROP INDEX "LoyaltyCustomer_restaurantId_progressCount_idx";
DROP INDEX "LoyaltyProgram_restaurantId_key";

-- Create the new program-specific customer progress table.
CREATE TABLE "LoyaltyCustomerProgram" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "progressCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCustomerProgram_pkey" PRIMARY KEY ("id")
);

-- Create indexes for the new table.
CREATE INDEX "LoyaltyCustomerProgram_customerId_idx"
ON "LoyaltyCustomerProgram"("customerId");

CREATE INDEX "LoyaltyCustomerProgram_programId_idx"
ON "LoyaltyCustomerProgram"("programId");

CREATE UNIQUE INDEX "LoyaltyCustomerProgram_customerId_programId_key"
ON "LoyaltyCustomerProgram"("customerId", "programId");

-- Migrate existing customer loyalty progress.
-- Every existing customer with a program gets one
-- customer-program progress record.
INSERT INTO "LoyaltyCustomerProgram" (
    "id",
    "customerId",
    "programId",
    "progressCount",
    "createdAt",
    "updatedAt"
)
SELECT
    "id" || '_' || "programId",
    "id",
    "programId",
    "progressCount",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "LoyaltyCustomer"
WHERE "programId" IS NOT NULL;

-- Only after the data has been migrated, remove the old columns.
ALTER TABLE "LoyaltyCustomer"
DROP COLUMN "programId",
DROP COLUMN "progressCount";

-- Indexes required by the new Prisma schema.
CREATE INDEX "AuditLog_restaurantId_idx"
ON "AuditLog"("restaurantId");

CREATE INDEX "LoyaltyProgram_restaurantId_idx"
ON "LoyaltyProgram"("restaurantId");

-- Add the new relationships.
ALTER TABLE "LoyaltyCustomerProgram"
ADD CONSTRAINT "LoyaltyCustomerProgram_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "LoyaltyCustomer"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LoyaltyCustomerProgram"
ADD CONSTRAINT "LoyaltyCustomerProgram_programId_fkey"
FOREIGN KEY ("programId")
REFERENCES "LoyaltyProgram"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;