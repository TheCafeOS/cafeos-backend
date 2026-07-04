import { prisma } from "../lib/prisma.js";

export const getTables = async (restaurantId: string) => {
  return prisma.restaurantTable.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });
};

export const addTable = async (
  restaurantId: string,
  name: string,
) => {
  return prisma.restaurantTable.create({
    data: {
      restaurantId,
      name,
      qrCode: crypto.randomUUID(),
    },
  });
};

export const editTable = async (
  restaurantId: string,
  id: string,
  data: {
    name?: string;
    status?: string;
  },
) => {
  const updated = await prisma.restaurantTable.updateMany({
    where: {
      id,
      restaurantId,
    },
    data,
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.restaurantTable.findUnique({
    where: { id },
  });
};

export const removeTable = async (
  restaurantId: string,
  id: string,
) => {
  const deleted = await prisma.restaurantTable.deleteMany({
    where: {
      id,
      restaurantId,
    },
  });

  return deleted.count > 0;
};