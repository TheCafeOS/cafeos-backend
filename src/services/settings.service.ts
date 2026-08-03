import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  uploadImage,
  deleteImage,
} from "./cloudinary.service.js";
import { AuditAction } from "@prisma/client";

import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import { logger } from "../lib/logger.js";

async function getRestaurantOrThrow(
  restaurantId: string,
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: restaurantId,
    },
  });

  if (!restaurant) {
    throw new AppError(
      "Restaurant not found",
      404,
    );
  }

  return restaurant;
}

export const getSettings = async (
  restaurantId: string,
  currentEmployeeId: string,
) => {
  const restaurant = await getRestaurantOrThrow(
    restaurantId,
  );


  const employee = await prisma.employee.findFirst({
    where: {
      id: currentEmployeeId,
      restaurantId,
    },
    select: {
      name: true,
      email: true,
      role: true,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found", 404);
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
    account: employee,
  };
};

export const updateSettings = async (
  restaurantId: string,
  currentEmployeeId: string,
  data: {
    name: string;
    restaurantEmail: string;

    phone?: string | null;
    address?: string | null;

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
  await getRestaurantOrThrow(
    restaurantId,
  );
  data.name = data.name.trim();

  data.restaurantEmail =
    data.restaurantEmail
      .trim()
      .toLowerCase();

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data,
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.SETTINGS_UPDATED,

    entity: AuditEntity.Restaurant,
    entityId: updatedRestaurant.id,

    metadata: {
      name: updatedRestaurant.name,
      restaurantEmail: updatedRestaurant.restaurantEmail,
      themeColor: updatedRestaurant.themeColor,
      cuisineType: updatedRestaurant.cuisineType,
    },
  });

  return getSettings(
    restaurantId,
    currentEmployeeId,
  );
};

export const uploadRestaurantLogo = async (
  restaurantId: string,
  currentEmployeeId: string,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError("Logo image is required.", 400);
  }

  const restaurant = await getRestaurantOrThrow(
    restaurantId,
  );

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  // Upload new logo first
  const uploaded = await uploadImage(
    file.buffer,
    `cafeos/restaurants/${restaurantId}/logos`,
  );

  try {
    await prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        logoUrl: uploaded.secureUrl,
        logoPublicId: uploaded.publicId,
      },
    });
  } catch (error) {
    await deleteImage(uploaded.publicId).catch((error) => {
      logger.error(
        {
          err: error,
          publicId: uploaded.publicId,
        },
        "Failed to rollback uploaded logo",
      );
    });

    throw error;
  }

  if (restaurant.logoPublicId) {
    deleteImage(
      restaurant.logoPublicId,
    ).catch((error) => {
      logger.error(
        {
          err: error,
          publicId: restaurant.logoPublicId,
        },
        "Failed to delete previous logo",
      );
    });
  }

  return getSettings(
    restaurantId,
    currentEmployeeId,
  );
};

export const uploadRestaurantCover = async (
  restaurantId: string,
  currentEmployeeId: string,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError("Cover image is required.", 400);
  }

  const restaurant = await getRestaurantOrThrow(
    restaurantId,
  );

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  const uploaded = await uploadImage(
    file.buffer,
    `cafeos/restaurants/${restaurantId}/covers`,
  );

  try {
    await prisma.restaurant.update({
      where: {
        id: restaurantId,
      },
      data: {
        coverImageUrl: uploaded.secureUrl,
        coverPublicId: uploaded.publicId,
      },
    });
  } catch (error) {
    await deleteImage(uploaded.publicId).catch((error) => {
      logger.error(
        {
          err: error,
          publicId: uploaded.publicId,
        },
        "Failed to rollback uploaded cover",
      );
    });

    throw error;
  }

  if (restaurant.coverPublicId) {
    deleteImage(
      restaurant.coverPublicId,
    ).catch((error) => {
      logger.error(
        {
          err: error,
          publicId: restaurant.coverPublicId,
        },
        "Failed to delete previous cover",
      );
    });
  }

  return getSettings(
    restaurantId,
    currentEmployeeId,
  );
};