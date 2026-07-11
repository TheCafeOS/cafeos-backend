import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const getSettings = async (restaurantId: string) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: restaurantId,
    },
    include: {
      employees: {
        where: {
          role: "OWNER",
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
        take: 1,
      },
    },
  });

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return {
    restaurant: {
      name: restaurant.name,
      restaurantEmail: restaurant.restaurantEmail,
      phone: restaurant.phone,
      address: restaurant.address,
    },
    owner: restaurant.employees[0] ?? null,
  };
};

export const updateSettings = async (
  restaurantId: string,
  data: {
    name: string;
    restaurantEmail: string;
    phone?: string | null;
    address?: string | null;
  },
) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: restaurantId,
    },
  });

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data,
  });

  return getSettings(restaurantId);
};