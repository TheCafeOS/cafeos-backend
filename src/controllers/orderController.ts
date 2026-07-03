import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { broadcastOrderEvent } from '../lib/socket.js';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tableId, customerPhone, items } = req.body;

    if (!tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Table and items are required' });
    }

    const restaurantId = req.employee?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table || table.restaurantId !== restaurantId) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: items.map((item: { menuItemId: string }) => item.menuItemId) },
        restaurantId,
      },
    });

    if (menuItems.length !== items.length) {
      return res.status(400).json({ message: 'One or more menu items are invalid' });
    }

    const total = items.reduce((sum: number, item: any) => {
      const menuItem = menuItems.find((candidate) => candidate.id === item.menuItemId);
      return sum + Number(menuItem?.price || 0) * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        customerPhone,
        total,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: Number(menuItems.find((candidate) => candidate.id === item.menuItemId)?.price || 0),
          })),
        },
      },
    });

    // Broadcast ORDER_CREATED event
    broadcastOrderEvent(restaurantId, tableId, 'ORDER_CREATED', {
      orderId: order.id,
      status: order.status,
      total: order.total,
      itemCount: items.length,
      customerPhone: order.customerPhone,
      timestamp: order.createdAt,
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

export const listOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { restaurantId: req.employee?.restaurantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    // Fetch order before update to get tableId and restaurantId
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Broadcast ORDER_UPDATED event
    broadcastOrderEvent(updatedOrder.restaurantId, updatedOrder.tableId, 'ORDER_UPDATED', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      timestamp: updatedOrder.updatedAt,
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
};
