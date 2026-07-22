import { prisma } from "../lib/prisma.js";
import { broadcastOrderEvent } from "../lib/socket.js";
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
import {
  getPaginationMeta,
} from "../utils/pagination.js";

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

  const total = items.reduce((sum, item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!;

    return (
      sum +
      Number(menuItem.price) * item.quantity
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
            menuItemMap.get(item.menuItemId)!.price,
          ),
        })),
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

  if (filters.search?.trim()) {
  const search = filters.search.trim();

  where.OR = [
    {
      id: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      customerPhone: {
        contains: search,
        mode: "insensitive",
      },
    },
    {
      table: {
        name: {
          contains: search,
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
    throw new AppError("Order not found", 404);
  }

  return toOrderResponse(order);
};

export const updateOrderStatus = async (
  restaurantId: string,
  currentEmployeeId: string,
  orderId: string,
  status: OrderStatus,
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const currentStatus = order.status as OrderStatus;

  if (!canTransitionOrderStatus(currentStatus, status)) {
    throw new AppError(
      "Invalid order status transition.",
      409,
    );
  }

  const updated = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
    include: orderWithRelations,
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.ORDER_STATUS_CHANGED,

    entity: AuditEntity.Order,
    entityId: updated.id,

    metadata: {
      previousStatus: currentStatus,
      newStatus: updated.status,
      tableId: updated.tableId,
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

  return toOrderResponse(updated);
};