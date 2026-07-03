import { prisma } from "../lib/prisma.js";

export const getCategories = async (restaurantId: string) => {
  return prisma.category.findMany({
    where: { restaurantId },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addCategory = async (
  restaurantId: string,
  name: string,
) => {
  return prisma.category.create({
    data: {
      restaurantId,
      name,
    },
  });
};

export const editCategory = async (
  restaurantId: string,
  id: string,
  name: string,
) => {
  const updated = await prisma.category.updateMany({
    where: {
      id,
      restaurantId,
    },
    data: {
      name,
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.category.findUnique({
    where: {
      id,
    },
  });
};

export const removeCategory = async (
  restaurantId: string,
  id: string,
) => {
  const deleted = await prisma.category.deleteMany({
    where: {
      id,
      restaurantId,
    },
  });

  return deleted.count > 0;
};