export const SocketEvents = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_UPDATED: "ORDER_UPDATED",
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  TABLES_MERGED: "TABLES_MERGED",
  TABLES_UNMERGED: "TABLES_UNMERGED",
} as const;

export const SocketRooms = {
  restaurant: (restaurantId: string) =>
    `restaurant_${restaurantId}`,

  employee: (employeeId: string) =>
    `employee_${employeeId}`,

  table: (tableId: string) =>
    `table_${tableId}`,
}; 