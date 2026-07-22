import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../lib/logger.js";

import {
  uploadImage,
  deleteImage,
} from "./cloudinary.service.js";
import {
  AuditAction,
  Prisma,
} from "@prisma/client";

import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import {
  getPaginationMeta,
  getPaginationParams,
} from "../utils/pagination.js";

export const getMenuItems = async (
  restaurantId: string,
  page?: string,
  limit?: string,
) => {
  const pagination = getPaginationParams(page, limit);

  const where = {
    restaurantId,
  };

  const [menuItems, totalItems] = await prisma.$transaction([
    prisma.menuItem.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    prisma.menuItem.count({
      where,
    }),
  ]);

  return {
    data: menuItems,
    pagination: getPaginationMeta(
      pagination.page,
      pagination.limit,
      totalItems,
    ),
  };
};

export const addMenuItem = async (
  restaurantId: string,
  currentEmployeeId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string;  
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
  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId,
      ...data,
      isAvailable: data.isAvailable ?? true,
    },
  });
  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.MENU_CREATED,

    entity: AuditEntity.Menu,
    entityId: menuItem.id,

    metadata: {
      name: menuItem.name,
      price: menuItem.price,
      categoryId: menuItem.categoryId,
    },
  });

  return menuItem;
};

export const editMenuItem = async (
  restaurantId: string,
  currentEmployeeId: string,
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
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

  const menuItem = await prisma.menuItem.findUnique({
    where: {
      id,
    },
  });
  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.MENU_UPDATED,

    entity: AuditEntity.Menu,
    entityId: menuItem.id,

    metadata: {
      name: menuItem.name,
      price: menuItem.price,
      isAvailable: menuItem.isAvailable,
    },
  });

  return menuItem;
};

export const removeMenuItem = async (
  restaurantId: string,
  currentEmployeeId: string,
  id: string,
) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  try {
    await prisma.menuItem.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new AppError(
        "This menu item cannot be deleted because it has already been used in customer orders.",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientUnknownRequestError &&
      error.message.includes("violates RESTRICT setting") &&
      error.message.includes("OrderItem_menuItemId_fkey")
    ) {
      throw new AppError(
        "This menu item cannot be deleted because it has already been used in customer orders.",
        409,
      );
    }

    throw error;
  }

  try {
    await auditService.log({
      restaurantId,
      employeeId: currentEmployeeId,

      action: AuditAction.MENU_DELETED,

      entity: AuditEntity.Menu,
      entityId: menuItem.id,

      metadata: {
        name: menuItem.name,
        price: menuItem.price,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        menuItemId: menuItem.id,
      },
      "Failed to write menu deletion audit log",
    );
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