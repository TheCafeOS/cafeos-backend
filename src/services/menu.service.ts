import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../lib/logger.js";

import {
  uploadImage,
  deleteImage,
} from "./cloudinary.service.js";

import {
  AuditAction,
  FoodType,
  Prisma,
} from "@prisma/client";

import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";

import {
  getPaginationMeta,
  getPaginationParams,
} from "../utils/pagination.js";

async function getMenuItemOrThrow(
  restaurantId: string,
  menuItemId: string,
) {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      restaurantId,
    },
  });

  if (!menuItem) {
    throw new AppError("Menu item not found.", 404);
  }

  return menuItem;
}

async function validateCategory(
  restaurantId: string,
  categoryId?: string,
) {
  if (!categoryId) return;

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found.", 404);
  }
}

export const getMenuItems = async (
  restaurantId: string,
  page?: string,
  limit?: string,
  search?: string,
  categoryId?: string,
  isAvailable?: boolean,
  sort?: "name" | "price" | "createdAt",
  order?: "asc" | "desc",
) => {
  const pagination = getPaginationParams(page, limit);

  const normalizedSearch = search?.trim();

  const where: Prisma.MenuItemWhereInput = {
    restaurantId,

    ...(normalizedSearch && {
      OR: [
        {
          name: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: normalizedSearch,
            mode: "insensitive",
          },
        },
      ],
    }),

    ...(categoryId && {
      categoryId,
    }),

    ...(isAvailable !== undefined && {
      isAvailable,
    }),
  };

  const orderBy: Prisma.MenuItemOrderByWithRelationInput = {
    [sort ?? "createdAt"]: order ?? "asc",
  };

  const [menuItems, totalItems] = await prisma.$transaction([
    prisma.menuItem.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy,

      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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
    foodType?: FoodType;
  },
) => {
  await validateCategory(
    restaurantId,
    data.categoryId,
  );

  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId,

      name: data.name.trim(),
      description: data.description?.trim(),
      price: data.price,

      categoryId: data.categoryId,

      isAvailable:
        data.isAvailable ?? true,

      foodType: data.foodType,
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
      foodType: menuItem.foodType,
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
    foodType?: FoodType;
  },
) => {
  const existingMenuItem =
    await getMenuItemOrThrow(
      restaurantId,
      id,
    );

  await validateCategory(
    restaurantId,
    data.categoryId,
  );

  const menuItem = await prisma.menuItem.update({
    where: {
      id,
    },
    data: {
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.description !== undefined && {
        description: data.description?.trim(),
      }),

      ...(data.price !== undefined && {
        price: data.price,
      }),

      ...(data.categoryId !== undefined && {
        categoryId: data.categoryId,
      }),

      ...(data.isAvailable !== undefined && {
        isAvailable: data.isAvailable,
      }),
      ...(data.foodType !== undefined && {
        foodType: data.foodType,
      }),
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.MENU_UPDATED,

    entity: AuditEntity.Menu,
    entityId: menuItem.id,

    metadata: {
      previousName: existingMenuItem.name,
      newName: menuItem.name,

      previousPrice: existingMenuItem.price,
      newPrice: menuItem.price,

      isAvailable: menuItem.isAvailable,

      previousFoodType: existingMenuItem.foodType,
      newFoodType: menuItem.foodType,
    },
  });

  return menuItem;
};

export const removeMenuItem = async (
  restaurantId: string,
  currentEmployeeId: string,
  id: string,
) => {
  const menuItem =
    await getMenuItemOrThrow(
      restaurantId,
      id,
    );

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

  const menuItem = await getMenuItemOrThrow(
    restaurantId,
    menuItemId,
  );

  // Upload new image first
  const uploaded = await uploadImage(
    file.buffer,
    `cafeos/restaurants/${restaurantId}/menu`,
  );

  try {
    const updatedMenuItem = await prisma.menuItem.update({
      where: {
        id: menuItemId,
      },
      data: {
        imageUrl: uploaded.secureUrl,
        imagePublicId: uploaded.publicId,
      },
    });

    // Delete previous image (best effort)
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
  } catch (error) {
    // Rollback newly uploaded image if DB update fails
    await deleteImage(uploaded.publicId).catch((rollbackError) => {
      logger.error(
        {
          err: rollbackError,
          publicId: uploaded.publicId,
        },
        "Failed to rollback uploaded Cloudinary image",
      );
    });

    throw error;
  }
};