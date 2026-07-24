/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('VEG', 'NON_VEG', 'EGG');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "foodType" "FoodType" NOT NULL DEFAULT 'VEG';

-- CreateIndex
CREATE UNIQUE INDEX "Category_restaurantId_name_key" ON "Category"("restaurantId", "name");
