export const SocketEvents = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_UPDATED: "ORDER_UPDATED",
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
} as const;

export const SocketRooms = {
  restaurant: (restaurantId: string) =>
    `restaurant_${restaurantId}`,

  table: (tableId: string) =>
    `table_${tableId}`,
} as const;