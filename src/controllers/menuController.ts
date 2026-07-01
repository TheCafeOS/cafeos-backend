import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listMenuItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: req.employee?.restaurantId },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(menuItems);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch menu items' });
  }
};

export const createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, imageUrl, isAvailable } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Menu item name and price are required' });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId: req.employee?.restaurantId as string,
        name,
        description,
        price,
        categoryId,
        imageUrl,
        isAvailable: isAvailable ?? true,
      },
    });

    return res.status(201).json(menuItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create menu item' });
  }
};

export const updateMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, description, price, categoryId, imageUrl, isAvailable } = req.body;

    const updated = await prisma.menuItem.updateMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        isAvailable,
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id } });
    return res.json(menuItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update menu item' });
  }
};

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const deleted = await prisma.menuItem.deleteMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete menu item' });
  }
};
