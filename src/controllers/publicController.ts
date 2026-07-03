import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

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
