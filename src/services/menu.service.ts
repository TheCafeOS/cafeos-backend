import { Readable } from "stream";

import { prisma } from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";

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

const uploadBuffer = (
  buffer: Buffer,
  restaurantId: string,
): Promise<{
  secure_url: string;
  public_id: string;
}> =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `cafeos/restaurants/${restaurantId}/menu`,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    Readable.from(buffer).pipe(upload);
  });

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
  const uploaded = await uploadBuffer(
    file.buffer,
    restaurantId,
  );

  let updatedMenuItem;

  try {
    // 2. Update the database
    updatedMenuItem = await prisma.menuItem.update({
      where: {
        id: menuItemId,
      },
      data: {
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      },
    });
  } catch (error) {
    // Roll back the newly uploaded image if DB update fails
    await cloudinary.uploader
      .destroy(uploaded.public_id)
      .catch(() => {});

    throw error;
  }

  // 3. Delete the previous image (best effort)
  if (menuItem.imagePublicId) {
    cloudinary.uploader
      .destroy(menuItem.imagePublicId)
      .catch((error) => {
        console.error(
          "Failed to delete previous Cloudinary image:",
          error,
        );
      });
  }

  return updatedMenuItem;
};