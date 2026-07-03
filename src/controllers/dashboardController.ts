import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getTodayStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.employee?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Unauthorized' });
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

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

    return res.json({
      date: today.toISOString().split('T')[0],
      totalOrders,
      completedOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

export const getRecentOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.employee?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: { menuItem: true },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json(
      orders.map((order) => ({
        id: order.id,
        tableId: order.table.id,
        tableName: order.table.name,
        status: order.status,
        total: Number(order.total),
        itemCount: order.items.length,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrdersByStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.employee?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId },
      _count: true,
    });

    return res.json(
      orders.map((order) => ({
        status: order.status,
        count: order._count,
      }))
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch order counts' });
  }
};

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.employee?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, statusBreakdown, recentOrders] = await Promise.all([
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
        by: ['status'],
        where: { restaurantId },
        _count: true,
    }),

    prisma.order.findMany({
        where: { restaurantId },
        include: { table: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
    }),
    ]);

    const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
    );

    return res.json({
      today: {
        totalOrders: todayOrders.length,
        totalRevenue: todayRevenue,
        date: today.toISOString().split('T')[0],
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        tableName: order.table.name,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};
