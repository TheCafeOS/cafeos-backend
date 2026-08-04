import { prisma } from "../lib/prisma.js";
import { broadcastOrderEvent } from "../lib/socket.js";
import { SocketEvents } from "../constants/socketEvents.js";
import { AppError } from "../utils/AppError.js";
import {
  OrderStatus,
  canTransitionOrderStatus,
} from "../utils/orderStatus.js";
import {
  AuditAction,
  Prisma,
} from "@prisma/client";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import { toOrderResponse } from "../utils/order.mapper.js";
import { getPaginationMeta } from "../utils/pagination.js";
import { loyaltyService } from "./loyalty.service.js";
import * as notificationService from "./notification.service.js";

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
};

type OrderFilters = {
  status?: OrderStatus;
  tableId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  sort?: "createdAt" | "status" | "total";
  order?: "asc" | "desc";
};

const orderWithRelations = Prisma.validator<Prisma.OrderInclude>()({
  table: {
    select: {
      id: true,
      name: true,
    },
  },
  items: {
    include: {
      menuItem: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  },
});

async function getOrderOrThrow(
  restaurantId: string,
  orderId: string,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
  });

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return order;
}

export const createRestaurantOrder = async (
  restaurantId: string,
  currentEmployeeId: string,
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
    throw new AppError("Table not found", 404);
  }

  if (table.status === "INACTIVE") {
    throw new AppError("This table is inactive", 403);
  }

  return createOrderForTable(
    table.restaurantId,
    currentEmployeeId,
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
      qrCode: qrToken,
    },
  });

  if (!table) {
    throw new AppError("Invalid QR code", 404);
  }

  if (table.status === "INACTIVE") {
    throw new AppError("This table is inactive", 403);
  }

  return createOrderForTable(
    table.restaurantId,
    null,
    table.id,
    customerPhone,
    items,
  );
};

async function createOrderForTable(
  restaurantId: string,
  currentEmployeeId: string | null,
  tableId: string,
  customerPhone: string | null,
  items: OrderItemInput[],
) {
  if (!items.length) {
    throw new AppError("Items are required", 400);
  }

  for (const item of items) {
    if (item.quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
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

  const menuItemMap = new Map(
    menuItems.map((item) => [item.id, item]),
  );

  if (menuItems.length !== items.length) {
    throw new AppError(
      "One or more menu items are invalid",
      400,
    );
  }

  const orderItems = items.map((item) => {
    const menuItem =
      menuItemMap.get(item.menuItemId)!;

    return {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      price: Number(menuItem.price),
    };
  });

  const total = orderItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  const customer = customerPhone
    ? await loyaltyService.getOrCreateCustomer(restaurantId, customerPhone)
    : null;

  const order = await prisma.order.create({
    data: {
      restaurantId,
      tableId,
      customerPhone,
      customerId: customer?.id ?? null,
      total,
      items: {
        create: orderItems,
      },
    },
    include: orderWithRelations,
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.ORDER_CREATED,

    entity: AuditEntity.Order,
    entityId: order.id,

    metadata: {
      tableId: order.tableId,
      total: order.total,
      itemCount: order.items.length,
      customerPhone: order.customerPhone,
    },
  });

  broadcastOrderEvent(
    restaurantId,
    tableId,
    SocketEvents.ORDER_CREATED,
    {
      orderId: order.id,
      status: order.status,
      total: order.total,
      itemCount: order.items.length,
      customerPhone: order.customerPhone,
      timestamp: order.createdAt,
    },
  );

  await notificationService.notifyNewOrder({
    restaurantId,
    orderId: order.id,
    tableId: order.table.id,
    tableName: order.table.name,
    total: Number(order.total),
    itemCount: order.items.length,
  });

  return toOrderResponse(order);
}

export const getRestaurantOrders = async (
  restaurantId: string,
  page: number,
  limit: number,
  filters: OrderFilters,
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    restaurantId,
  };

  const orderBy: Prisma.OrderOrderByWithRelationInput = {
    [filters.sort ?? "createdAt"]:
      filters.order ?? "desc",
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tableId) {
    where.tableId = filters.tableId;
  }

  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from && {
        gte: filters.from,
      }),
      ...(filters.to && {
        lte: filters.to,
      }),
    };
  }

  const normalizedSearch =
    filters.search?.trim();

  if (normalizedSearch) {
    where.OR = [
      {
        id: {
          contains: normalizedSearch,
          mode: "insensitive",
        },
      },
      {
        customerPhone: {
          contains: normalizedSearch,
          mode: "insensitive",
        },
      },
      {
        table: {
          name: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [orders, totalItems] =
    await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: orderWithRelations,
        orderBy,
        skip,
        take: limit,
      }),

      prisma.order.count({
        where,
      }),
    ]);

  return {
    data: orders.map(toOrderResponse),

    pagination: getPaginationMeta(
      page,
      limit,
      totalItems,
    ),
  };
};

export const getRestaurantOrder = async (
  restaurantId: string,
  orderId: string,
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
    include: orderWithRelations,
  });

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return toOrderResponse(order);
};

export const updateOrderStatus = async (
  restaurantId: string,
  currentEmployeeId: string,
  orderId: string,
  status: OrderStatus,
) => {
  const existingOrder = await getOrderOrThrow(
    restaurantId,
    orderId,
  );

  const currentStatus =
    existingOrder.status as OrderStatus;

  if (
    !canTransitionOrderStatus(
      currentStatus,
      status,
    )
  ) {
    throw new AppError(
      "Invalid order status transition.",
      409,
    );
  }

  const updatedOrder =
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
      include: orderWithRelations,
    });

  if (status === "COMPLETED") {
    await loyaltyService.applyOrderCompletion(restaurantId, updatedOrder.id);
  }

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action:
      AuditAction.ORDER_STATUS_CHANGED,

    entity: AuditEntity.Order,
    entityId: updatedOrder.id,

    metadata: {
      previousStatus: currentStatus,
      newStatus: updatedOrder.status,
      tableId: updatedOrder.tableId,
    },
  });

broadcastOrderEvent(
  updatedOrder.restaurantId,
  updatedOrder.tableId,
  SocketEvents.ORDER_UPDATED,
  {
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    timestamp: updatedOrder.updatedAt,
  },
);

  await notificationService.notifyOrderStatusChanged({
    restaurantId,
    orderId: updatedOrder.id,
    tableId: updatedOrder.table.id,
    tableName: updatedOrder.table.name,
    status: updatedOrder.status,
  });

  return toOrderResponse(updatedOrder);
};