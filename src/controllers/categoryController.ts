import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { restaurantId: req.employee?.restaurantId },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        restaurantId: req.employee?.restaurantId as string,
        name,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create category' });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name } = req.body;

    const updated = await prisma.category.updateMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
      data: { name },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    return res.json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const deleted = await prisma.category.deleteMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete category' });
  }
};
