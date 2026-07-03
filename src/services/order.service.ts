import { prisma } from "../lib/prisma.js";
import { broadcastOrderEvent } from "../lib/socket.js";

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
};

export const createRestaurantOrder = async (
  restaurantId: string,
  tableId: string,
  customerPhone: string | null,
  items: OrderItemInput[],
) => {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      restaurantId,
    },
  });

  if (!table) {
    throw new Error("TABLE_NOT_FOUND");
  }

  return createOrderForTable(
    table.restaurantId,
    table.id,
    customerPhone,
    items,
  );
};

export const createPublicOrder = async (
  qrToken: string,
  customerPhone: string | null,
  items: OrderItemInput[],
) => {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      qrCode: `/qr/${qrToken}`,
    },
  });

  if (!table) {
    throw new Error("INVALID_QR");
  }

  if (table.status === "INACTIVE") {
    throw new Error("TABLE_INACTIVE");
  }

  return createOrderForTable(
    table.restaurantId,
    table.id,
    customerPhone,
    items,
  );
};

async function createOrderForTable(
  restaurantId: string,
  tableId: string,
  customerPhone: string | null,
  items: OrderItemInput[],
) {
  if (!items.length) {
    throw new Error("EMPTY_ORDER");
  }

  for (const item of items) {
    if (item.quantity < 1) {
      throw new Error("INVALID_QUANTITY");
    }
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      restaurantId,
      isAvailable: true,
      id: {
        in: items.map((i) => i.menuItemId),
      },
    },
  });

  if (menuItems.length !== items.length) {
    throw new Error("INVALID_MENU_ITEMS");
  }

  const total = items.reduce((sum, item) => {
    const menuItem = menuItems.find(
      (m) => m.id === item.menuItemId,
    );

    return (
      sum +
      Number(menuItem!.price) * item.quantity
    );
  }, 0);

  const order = await prisma.order.create({
    data: {
      restaurantId,
      tableId,
      customerPhone,
      total,
      items: {
        create: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: Number(
            menuItems.find(
              (m) => m.id === item.menuItemId,
            )!.price,
          ),
        })),
      },
    },
    include: {
      table: true,
      items: true,
    },
  });

  broadcastOrderEvent(
    restaurantId,
    tableId,
    "ORDER_CREATED",
    {
      orderId: order.id,
      status: order.status,
      total: order.total,
      itemCount: order.items.length,
      customerPhone: order.customerPhone,
      timestamp: order.createdAt,
    },
  );

  return order;
}

export const getRestaurantOrders = async (
  restaurantId: string,
) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getRestaurantOrder = async (
  restaurantId: string,
  orderId: string,
) => {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
    include: {
      items: true,
    },
  });
};

export const updateOrderStatus = async (
  restaurantId: string,
  orderId: string,
  status: string,
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
  });

  if (!order) {
    return null;
  }

  const updated = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });

  broadcastOrderEvent(
    updated.restaurantId,
    updated.tableId,
    "ORDER_UPDATED",
    {
      orderId: updated.id,
      status: updated.status,
      timestamp: updated.updatedAt,
    },
  );

  return updated;
}