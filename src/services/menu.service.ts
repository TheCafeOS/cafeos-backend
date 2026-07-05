import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const getMenuItems = async (restaurantId: string) => {
  return prisma.menuItem.findMany({
    where: { restaurantId },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addMenuItem = async (
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
  },
) => {
  return prisma.menuItem.create({
    data: {
      restaurantId,
      ...data,
      isAvailable: data.isAvailable ?? true,
    },
  });
};

export const editMenuItem = async (
  restaurantId: string,
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
  },
) => {
  const updated = await prisma.menuItem.updateMany({
    where: {
      id,
      restaurantId,
    },
    data,
  });

  if (updated.count === 0) {
    throw new AppError("Menu item not found", 404);
  }

  return prisma.menuItem.findUnique({
    where: {
      id,
    },
  });
};

export const removeMenuItem = async (
  restaurantId: string,
  id: string,
) => {
  const deleted = await prisma.menuItem.deleteMany({
    where: {
      id,
      restaurantId,
    },
  });

  if (deleted.count === 0) {
    throw new AppError("Menu item not found", 404);
  }
};