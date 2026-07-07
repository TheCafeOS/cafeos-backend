import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const getTodayStats = async (restaurantId: string) => {
  if (!restaurantId) {
    throw new AppError("Unauthorized", 401);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  const totalOrders = orders.length;

  const completedOrders = orders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  return {
    date: today.toISOString().split("T")[0],
    totalOrders,
    completedOrders,
    totalRevenue,
    avgOrderValue:
      totalOrders > 0 ? totalRevenue / totalOrders : 0,
  };
};

export const getRecentOrders = async (
  restaurantId: string,
  limit = 10,
) => {
  const take = Math.min(limit, 50);
  if (!restaurantId) {
    throw new AppError("Unauthorized", 401);
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
    },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: Math.min(limit, 50),
  });

  return orders.map((order) => ({
    id: order.id,
    tableId: order.table.id,
    tableName: order.table.name,
    status: order.status,
    total: Number(order.total),
    itemCount: order.items.length,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
  }));
};

export const getOrdersByStatus = async (
  restaurantId: string,
) => {
  if (!restaurantId) {
    throw new AppError("Unauthorized", 401);
  }

  const orders = await prisma.order.groupBy({
    by: ["status"],
    where: {
      restaurantId,
    },
    _count: true,
  });

  return orders.map((order) => ({
    status: order.status,
    count: order._count,
  }));
};

export const getDashboardSummary = async (
  restaurantId: string,
) => {
  if (!restaurantId) {
    throw new AppError("Unauthorized", 401);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayOrders, statusBreakdown, recentOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      prisma.order.groupBy({
        by: ["status"],
        where: {
          restaurantId,
        },
        _count: true,
      }),

      prisma.order.findMany({
        where: {
          restaurantId,
        },
        include: {
          table: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return {
    today: {
      totalOrders: todayOrders.length,
      totalRevenue: todayRevenue,
      date: today.toISOString().split("T")[0],
    },

    statusBreakdown: statusBreakdown.map((status) => ({
      status: status.status,
      count: status._count,
    })),

    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      tableName: order.table.name,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
    })),
  };
};