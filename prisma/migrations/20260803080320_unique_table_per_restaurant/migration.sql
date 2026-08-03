/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,name]` on the table `RestaurantTable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_restaurantId_name_key" ON "RestaurantTable"("restaurantId", "name");
