import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { broadcastOrderEvent } from '../lib/socket.js';

export const getPublicMenu = async (req: Request, res: Response) => {
  try {
    const { qrToken } = req.params;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    // Find the table by matching qrCode ending with /qr/:qrToken
    const qrCodePattern = `/qr/${qrToken}`;
    const table = await prisma.restaurantTable.findFirst({
      where: {
        qrCode: qrCodePattern,
      },
      include: {
        restaurant: true,
      },
    });

    if (!table) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    // Check if table is active
    if (table.status === 'INACTIVE') {
      return res.status(403).json({ message: 'This table is inactive' });
    }

    // Fetch all categories for this restaurant, sorted by createdAt ascending
    const categories = await prisma.category.findMany({
      where: { restaurantId: table.restaurantId },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch all available menu items for this restaurant
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: table.restaurantId,
        isAvailable: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      table: {
        id: table.id,
        name: table.name,
        status: table.status,
        restaurantId: table.restaurantId,
      },
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        slug: table.restaurant.slug,
      },
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
      })),
      menuItems: menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryId: item.categoryId,
        category: item.category
          ? { id: item.category.id, name: item.category.name }
          : null,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch menu' });
  }
};

export const createPublicOrder = async (req: Request, res: Response) => {
  try {
    const { qrToken, customerPhone, items } = req.body;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Find the table by matching qrCode
    const qrCodePattern = `/qr/${qrToken}`;
    const table = await prisma.restaurantTable.findFirst({
      where: {
        qrCode: qrCodePattern,
      },
    });

    if (!table) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    // Check if table is active
    if (table.status === 'INACTIVE') {
      return res.status(403).json({ message: 'This table is inactive' });
    }

    // Validate all menu items exist and belong to the restaurant
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: items.map((item: { menuItemId: string }) => item.menuItemId) },
        restaurantId: table.restaurantId,
      },
    });

    if (menuItems.length !== items.length) {
      return res.status(400).json({ message: 'One or more menu items are invalid' });
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => {
      const menuItem = menuItems.find((candidate) => candidate.id === item.menuItemId);
      return sum + Number(menuItem?.price || 0) * item.quantity;
    }, 0);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        restaurantId: table.restaurantId,
        tableId: table.id,
        customerPhone: customerPhone || null,
        total,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: Number(
              menuItems.find((candidate) => candidate.id === item.menuItemId)?.price || 0
            ),
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Broadcast ORDER_CREATED event
    broadcastOrderEvent(order.restaurantId, order.tableId, 'ORDER_CREATED', {
      orderId: order.id,
      status: order.status,
      total: order.total,
      itemCount: items.length,
      customerPhone: order.customerPhone,
      timestamp: order.createdAt,
    });

    return res.status(201).json({
      id: order.id,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      customerPhone: order.customerPhone,
      status: order.status,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

export const getPublicOrder = async (req: Request, res: Response) => {
  try {
    const { qrToken, orderId } = req.params;
    const normalizedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;

    if (!qrToken || !normalizedOrderId) {
      return res.status(400).json({ message: 'QR token and order ID are required' });
    }

    // Find the table by matching qrCode
    const qrCodePattern = `/qr/${qrToken}`;
    const table = await prisma.restaurantTable.findFirst({
      where: {
        qrCode: qrCodePattern,
      },
    });

    if (!table) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    // Fetch the order and verify it belongs to this table
    const order = await prisma.order.findFirst({
      where: {
        id: normalizedOrderId,
        tableId: table.id,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({
      id: order.id,
      tableId: order.tableId,
      restaurantId: order.restaurantId,
      customerPhone: order.customerPhone,
      status: order.status,
      total: order.total,
      items: order.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItem: {
          name: item.menuItem.name,
          price: item.menuItem.price,
        },
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch order' });
  }
};

