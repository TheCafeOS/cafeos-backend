export function toOrderResponse(order: any) {
  return {
    id: order.id,
    status: order.status,
    customerPhone: order.customerPhone,
    total: Number(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    table: order.table
      ? {
          id: order.table.id,
          name: order.table.name,
        }
      : null,

    items: order.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),

      menuItem: item.menuItem
        ? {
            id: item.menuItem.id,
            name: item.menuItem.name,
            imageUrl: item.menuItem.imageUrl,
          }
        : null,
    })),
  };
}