import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../lib/logger.js";

import {
  uploadImage,
  deleteImage,
} from "./cloudinary.service.js";

export const getMenuItems = async (restaurantId: string) => {
  return prisma.menuItem.findMany({
    where: {
      restaurantId,
    },
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
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        restaurantId,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }
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
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        restaurantId,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }
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


export const uploadMenuImage = async (
  restaurantId: string,
  menuItemId: string,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError("Image is required.", 400);
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      restaurantId,
    },
  });

  if (!menuItem) {
    throw new AppError("Menu item not found.", 404);
  }

  // 1. Upload the new image first
  const uploaded = await uploadImage(
    file.buffer,
    `cafeos/restaurants/${restaurantId}/menu`,
  );

  let updatedMenuItem;

  try {
    // 2. Update the database
    updatedMenuItem = await prisma.menuItem.update({
      where: {
        id: menuItemId,
      },
      data: {
        imageUrl: uploaded.secureUrl,
        imagePublicId: uploaded.publicId,
      },
    });
  } catch (error) {
    // Roll back the newly uploaded image if DB update fails
    await deleteImage(uploaded.publicId).catch(() => {});

    throw error;
  }

  // 3. Delete the previous image (best effort)
  if (menuItem.imagePublicId) {
    deleteImage(menuItem.imagePublicId).catch((error) => {
        logger.error(
          {
            err: error,
            menuItemId,
            publicId: menuItem.imagePublicId,
          },
          "Failed to delete previous Cloudinary image",
        );
      });
  }

  return updatedMenuItem;
};