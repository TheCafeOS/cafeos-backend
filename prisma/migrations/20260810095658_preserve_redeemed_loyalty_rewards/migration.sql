-- DropForeignKey
ALTER TABLE "LoyaltyReward" DROP CONSTRAINT "LoyaltyReward_programId_fkey";

-- AlterTable
ALTER TABLE "LoyaltyReward" ALTER COLUMN "programId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
