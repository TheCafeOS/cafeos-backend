-- DropIndex
DROP INDEX "AuditLog_action_idx";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_employeeId_idx";

-- DropIndex
DROP INDEX "AuditLog_restaurantId_idx";

-- DropIndex
DROP INDEX "Category_restaurantId_idx";

-- DropIndex
DROP INDEX "RestaurantTable_restaurantId_idx";

-- CreateIndex
CREATE INDEX "AuditLog_restaurantId_createdAt_idx" ON "AuditLog"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_restaurantId_action_idx" ON "AuditLog"("restaurantId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_restaurantId_employeeId_idx" ON "AuditLog"("restaurantId", "employeeId");

-- CreateIndex
CREATE INDEX "Category_restaurantId_createdAt_idx" ON "Category"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Employee_restaurantId_createdAt_idx" ON "Employee"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Employee_restaurantId_role_idx" ON "Employee"("restaurantId", "role");

-- CreateIndex
CREATE INDEX "Employee_restaurantId_isActive_idx" ON "Employee"("restaurantId", "isActive");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_createdAt_idx" ON "MenuItem"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_isAvailable_idx" ON "MenuItem"("restaurantId", "isAvailable");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_categoryId_idx" ON "MenuItem"("restaurantId", "categoryId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_createdAt_idx" ON "Order"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_status_idx" ON "Order"("restaurantId", "status");

-- CreateIndex
CREATE INDEX "Order_restaurantId_tableId_idx" ON "Order"("restaurantId", "tableId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "RestaurantTable_restaurantId_status_idx" ON "RestaurantTable"("restaurantId", "status");

-- CreateIndex
CREATE INDEX "RestaurantTable_restaurantId_createdAt_idx" ON "RestaurantTable"("restaurantId", "createdAt");
