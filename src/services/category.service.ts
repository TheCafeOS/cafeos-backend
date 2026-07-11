import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

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
  const category = await prisma.category.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

export const removeCategory = async (
  restaurantId: string,
  id: string,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });
};