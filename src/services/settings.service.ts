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

      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,

      tagline: restaurant.tagline,
      description: restaurant.description,
      cuisineType: restaurant.cuisineType,

      website: restaurant.website,
      instagram: restaurant.instagram,
      facebook: restaurant.facebook,
      customLink: restaurant.customLink,

      themeColor: restaurant.themeColor,
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

    logoUrl?: string | null;
    coverImageUrl?: string | null;

    tagline?: string | null;
    description?: string | null;
    cuisineType?: string | null;

    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    customLink?: string | null;

    themeColor?: string | null;
  }
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