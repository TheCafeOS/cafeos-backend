/*
  Warnings:

  - The `status` column on the `RestaurantTable` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'INACTIVE');

-- AlterTable
ALTER TABLE "RestaurantTable" DROP COLUMN "status",
ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE';
