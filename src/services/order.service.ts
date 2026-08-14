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
import { offerService } from "./offer.service.js";

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

const orderWithRelations =
  Prisma.validator<Prisma.OrderInclude>()({
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
    appliedOffer: true,
    tableMerge: {
      include: {
        tables: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
  });

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
];

export const getActiveOrdersForTableSession =
  async (
    tableId: string,
    customerSessionId: string,
  ) => {
    return prisma.order.findMany({
      where: {
        tableId,
        customerSessionId,
        status: {
          in: ACTIVE_ORDER_STATUSES,
        },
      },
      include: orderWithRelations,
      orderBy: {
        createdAt: "asc",
      },
    });
  };

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
  customerSessionId: string,
  customerPhone: string | null,
  items: OrderItemInput[],
) => {
  const table =
    await prisma.restaurantTable.findFirst({
      where: {
        qrCode: qrToken,
      },
    });

  if (!table) {
    throw new AppError(
      "Invalid QR code",
      404,
    );
  }

  if (table.status === "INACTIVE") {
    throw new AppError(
      "This table is inactive",
      403,
    );
  }

  return createOrderForTable(
    table.restaurantId,
    null,
    table.id,
    customerPhone,
    items,
    customerSessionId,
  );
};

async function createOrderForTable(
  restaurantId: string,
  currentEmployeeId: string | null,
  tableId: string,
  customerPhone: string | null,
  items: OrderItemInput[],
  customerSessionId: string | null = null,
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

  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  const customer = customerPhone
    ? await loyaltyService.getOrCreateCustomer(
        restaurantId,
        customerPhone,
      )
    : null;

  const { offer, discountAmount } =
    await offerService.findBestOffer(
      restaurantId,
      subtotal,
    );

  const finalTotal = Math.max(
    subtotal - discountAmount,
    0,
  );

  const order = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "RestaurantTable"
        WHERE "id" = ${tableId}
        FOR UPDATE
      `;

      const activeOrders = customerSessionId
        ? await tx.order.findMany({
            where: {
              tableId,
              customerSessionId,
              status: {
                in: [
                  "PENDING",
                  "CONFIRMED",
                  "PREPARING",
                ],
              },
            },
            select: {
              id: true,
              customerSessionId: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          })
        : [];

      if (
        customerSessionId &&
        activeOrders.length >= 2
      ) {
        throw new AppError(
          "You already have the maximum of 2 active orders for this table.",
          409,
        );
      }

      return tx.order.create({
        data: {
          restaurantId,
          tableId,
          customerPhone,
          customerId: customer?.id ?? null,

          subtotal,
          discountAmount,
          total: finalTotal,

          appliedOfferId:
            offer?.id ?? null,

          items: {
            create: orderItems,
          },
        },
        include: orderWithRelations,
      });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );

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

export const getActiveOrderSessions = async (
  restaurantId: string,
) => {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      customerSessionId: {
        not: null,
      },
      status: {
        in: ACTIVE_ORDER_STATUSES,
      },
    },
    include: orderWithRelations,
    orderBy: {
      createdAt: "asc",
    },
  });

  const sessions = new Map<
    string,
    typeof orders
  >();

  for (const order of orders) {
    const customerSessionId =
      order.customerSessionId;

    if (!customerSessionId) {
      continue;
    }

    const sessionKey =
      `${order.tableId}:${customerSessionId}`;

    const existing =
      sessions.get(sessionKey);

    if (existing) {
      existing.push(order);
    } else {
      sessions.set(sessionKey, [order]);
    }
  }

  return Array.from(sessions.values()).map(
    (sessionOrders) => {
      const isCombined =
        sessionOrders.length === 2 &&
        sessionOrders.every(
          (order) => order.status === "PENDING",
        );

      const combinedTotal =
        sessionOrders.reduce(
          (sum, order) =>
            sum + Number(order.total),
          0,
        );

      return {
        type: isCombined
          ? "COMBINED"
          : "SEPARATE",

        table: {
          id: sessionOrders[0].table.id,
          name: sessionOrders[0].table.name,
        },

        orderCount: sessionOrders.length,

        combinedTotal,

        orders: sessionOrders.map(
          toOrderResponse,
        ),

        createdAt:
          sessionOrders[0].createdAt,
      };
    },
  );
};

export const updateOrderStatus = async (
  restaurantId: string,
  currentEmployeeId: string,
  orderId: string,
  status: OrderStatus,
) => {
  const result = await prisma.$transaction(
    async (tx) => {
      // Lock the order row so concurrent status updates
      // for the same order are serialized.
      const lockedOrders =
        await tx.$queryRaw<
          { id: string }[]
        >`
          SELECT "id"
          FROM "Order"
          WHERE "id" = ${orderId}
            AND "restaurantId" = ${restaurantId}
          FOR UPDATE
        `;

      if (lockedOrders.length === 0) {
        throw new AppError(
          "Order not found.",
          404,
        );
      }

      const existingOrder =
        await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: orderWithRelations,
        });

      if (!existingOrder) {
        throw new AppError(
          "Order not found.",
          404,
        );
      }

      const currentStatus =
        existingOrder.status as OrderStatus;

      // Idempotent status update:
      // If the requested status is already the current
      // status, return the current order without performing
      // any side effects.
      if (currentStatus === status) {
        return {
          order: existingOrder,
          previousStatus: currentStatus,
          changed: false,
        };
      }

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
        await tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            status,
          },
          include: orderWithRelations,
        });

      return {
        order: updatedOrder,
        previousStatus: currentStatus,
        changed: true,
      };
    },
  );

  const {
    order,
    previousStatus,
    changed,
  } = result;

  // Duplicate/idempotent request:
  // return the already-current order and do nothing else.
  if (!changed) {
    return toOrderResponse(order);
  }

  if (status === "COMPLETED") {
    await loyaltyService.applyOrderCompletion(
      restaurantId,
      order.id,
    );
  }

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action:
      AuditAction.ORDER_STATUS_CHANGED,

    entity: AuditEntity.Order,
    entityId: order.id,

    metadata: {
      previousStatus,
      newStatus: order.status,
      tableId: order.tableId,
    },
  });

  broadcastOrderEvent(
    order.restaurantId,
    order.tableId,
    SocketEvents.ORDER_UPDATED,
    {
      orderId: order.id,
      status: order.status,
      timestamp: order.updatedAt,
    },
  );

  return toOrderResponse(order);
};

export const cancelExpiredPendingOrders = async () => {
  const expirationTime = new Date(
    Date.now() - 2 * 60 * 60 * 1000,
  );

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lte: expirationTime,
      },
    },
    select: {
      id: true,
      restaurantId: true,
      tableId: true,
    },
  });

  for (const order of expiredOrders) {
    const result = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Another process/request may have already accepted/cancelled it.
    if (result.count === 0) {
      continue;
    }

    const updatedOrder = await prisma.order.findUnique({
      where: {
        id: order.id,
      },
    });

    if (!updatedOrder) {
      continue;
    }

    await auditService.log({
      restaurantId: updatedOrder.restaurantId,
      employeeId: null,
      action: AuditAction.ORDER_STATUS_CHANGED,
      entity: AuditEntity.Order,
      entityId: updatedOrder.id,
      metadata: {
        previousStatus: "PENDING",
        newStatus: "CANCELLED",
        tableId: updatedOrder.tableId,
        reason: "Automatically cancelled after 2 hours in PENDING status",
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
  }
};