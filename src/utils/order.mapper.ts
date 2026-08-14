export function toOrderResponse(order: any) {
  return {
    id: order.id,
    status: order.status,
    customerPhone: order.customerPhone,
    subtotal:
      Number(order.subtotal ?? order.total),

    discountAmount:
      Number(order.discountAmount ?? 0),

    total:
      Number(order.total),

    appliedOffer: order.appliedOffer
      ? {
          id: order.appliedOffer.id,
          name: order.appliedOffer.name,
          description:
            order.appliedOffer.description,
          discountType:
            order.appliedOffer.discountType,
          discountValue:
            Number(
              order.appliedOffer.discountValue,
            ),
          minimumOrderValue:
            Number(
              order.appliedOffer.minimumOrderValue,
            ),
          maximumDiscount:
            order.appliedOffer.maximumDiscount !==
            null
              ? Number(
                  order.appliedOffer.maximumDiscount,
                )
              : null,
        }
      : null,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    table: order.table
      ? {
          id: order.table.id,
          name: order.table.name,
        }
      : null,

    merge: order.merge
      ? {
          id: order.merge.id,
          isActive: order.merge.isActive,
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