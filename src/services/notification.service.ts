import {
  Notification,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { broadcastNotification } from "../lib/socket.js";
import { AppError } from "../utils/AppError.js";
import { getPaginationMeta } from "../utils/pagination.js";
import { logger } from "../lib/logger.js";

interface CreateNotificationInput {
  restaurantId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

interface GetNotificationsInput {
  employeeId: string;
  page: number;
  limit: number;
  isRead?: boolean;
  type?: NotificationType;
}

interface NewOrderNotificationInput {
  restaurantId: string;
  orderId: string;
  tableId: string;
  tableName: string;
  total: number;
  itemCount: number;
}

interface OrderStatusNotificationInput {
  restaurantId: string;
  orderId: string;
  tableId: string;
  tableName: string;
  status: string;
  total: number;
  itemCount: number;
}

interface RewardEarnedNotificationInput {
  restaurantId: string;
  customerId: string;
  customerPhone: string;
  rewardCount: number;
  rewardName: string;
  orderId: string;
}

interface RewardRedeemedNotificationInput {
  restaurantId: string;
  customerId: string;
  customerPhone: string;
  rewardId: string;
  rewardName?: string | null;
}

  async function publishNotifications(
    restaurantId: string,
    notifications: Notification[],
  ) {
    if (notifications.length === 0) {
      return;
    }

    notifications.forEach((notification) => {
      broadcastNotification(notification);
    });
  }

export async function createForRestaurant({
  restaurantId,
  type,
  title,
  message,
  data,
}: CreateNotificationInput): Promise<Notification[]> {
  const employees = await prisma.employee.findMany({
    where: {
      restaurantId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (employees.length === 0) {
    return [];
  }

  const notifications = await prisma.$transaction(
    employees.map((employee) =>
      prisma.notification.create({
        data: {
          employeeId: employee.id,
          type,
          title,
          message,
          data,
        },
      }),
    ),
  );

  try {
    await publishNotifications(
      restaurantId,
      notifications,
    );
  } catch (error) {
    logger.error(
      {
        err: error,
        restaurantId,
        notificationCount: notifications.length,
      },
      "Failed to broadcast notifications",
    );
  }

  return notifications;
}

export async function notifyNewOrder(
  input: NewOrderNotificationInput,
) {
  return createForRestaurant({
    restaurantId: input.restaurantId,
    type: "NEW_ORDER",
    title: "New Order",
    message: `A new order has been placed for Table ${input.tableName}.`,
    data: {
      orderId: input.orderId,
      tableId: input.tableId,
      tableName: input.tableName,
      total: input.total,
      itemCount: input.itemCount,
    },
  });
}

export async function notifyOrderStatusChanged(
  input: OrderStatusNotificationInput,
) {
  return createForRestaurant({
    restaurantId: input.restaurantId,
    type: "ORDER_STATUS",
    title: "Order Updated",
    message: `Order for Table ${input.tableName} is now ${input.status}.`,
    data: {
      orderId: input.orderId,
      tableId: input.tableId,
      tableName: input.tableName,
      status: input.status,
      total: input.total,
      itemCount: input.itemCount,
    },
  });
}

export async function notifyRewardEarned(
  input: RewardEarnedNotificationInput,
) {
  return createForRestaurant({
    restaurantId: input.restaurantId,
    type: "LOYALTY_REWARD",
    title: "Reward Earned",
    message: `${input.customerPhone} earned ${input.rewardCount} loyalty reward${input.rewardCount > 1 ? "s" : ""}.`,
    data: {
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      rewardCount: input.rewardCount,
      rewardName: input.rewardName,
      orderId: input.orderId,
    },
  });
}

export async function notifyRewardRedeemed(
  input: RewardRedeemedNotificationInput,
) {
  return createForRestaurant({
    restaurantId: input.restaurantId,
    type: "LOYALTY_REWARD",
    title: "Reward Redeemed",
    message: `${input.customerPhone} redeemed a loyalty reward.`,
    data: {
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      rewardId: input.rewardId,
      rewardName: input.rewardName,
    },
  });
}

export async function getNotifications({
  employeeId,
  page,
  limit,
  isRead,
  type,
}: GetNotificationsInput) {
  const where: Prisma.NotificationWhereInput = {
    employeeId,
  };

  if (typeof isRead === "boolean") {
    where.isRead = isRead;
  }

  if (type) {
    where.type = type;
  }

  const skip = (page - 1) * limit;

  const [items, totalItems] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.notification.count({
      where,
    }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(
      page,
      limit,
      totalItems,
    ),
  };
}

export async function getUnreadCount(
  employeeId: string,
) {
  const count = await prisma.notification.count({
    where: {
      employeeId,
      isRead: false,
    },
  });

  return { count };
}

export async function markAsRead(
  id: string,
  employeeId: string,
) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        employeeId,
      },
    });

  if (!notification) {
    throw new AppError(
      "Notification not found.",
      404,
    );
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(
  employeeId: string,
) {
  const result =
    await prisma.notification.updateMany({
      where: {
        employeeId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

  return {
    count: result.count,
  };
}

export async function deleteNotification(
  id: string,
  employeeId: string,
) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        employeeId,
      },
    });

  if (!notification) {
    throw new AppError(
      "Notification not found.",
      404,
    );
  }

  await prisma.notification.delete({
    where: {
      id,
    },
  });
}

