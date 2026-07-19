/*
  Warnings:

  - The `role` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'OWNER';
