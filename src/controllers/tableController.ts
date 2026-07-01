import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listTables = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: req.employee?.restaurantId },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(tables);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch tables' });
  }
};

export const createTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Table name is required' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId: req.employee?.restaurantId as string,
        name,
        qrCode: `https://cafeos.app/qr/${Math.random().toString(36).slice(2, 10)}`,
      },
    });

    return res.status(201).json(table);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create table' });
  }
};

export const updateTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, status } = req.body;

    const table = await prisma.restaurantTable.updateMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
      data: {
        name,
        status,
      },
    });

    if (table.count === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const updated = await prisma.restaurantTable.findUnique({ where: { id } });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update table' });
  }
};

export const deleteTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const deleted = await prisma.restaurantTable.deleteMany({
      where: {
        id,
        restaurantId: req.employee?.restaurantId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete table' });
  }
};
