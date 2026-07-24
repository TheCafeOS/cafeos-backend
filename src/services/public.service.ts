import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const getMenu = async (qrToken: string) => {
  if (!qrToken) {
    throw new AppError("QR token is required", 400);
  }

  const table = await prisma.restaurantTable.findUnique({
    where: {
      qrCode: qrToken,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          coverImageUrl: true,
          tagline: true,
          cuisineType: true,
          themeColor: true,
        },
      },
    },
  });

  if (!table) {
    throw new AppError("Invalid QR code", 404);
  }

  if (table.status === "INACTIVE") {
    throw new AppError("This table is inactive", 403);
  }

  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: {
        restaurantId: table.restaurantId,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    prisma.menuItem.findMany({
      where: {
        restaurantId: table.restaurantId,
        isAvailable: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  return {
    table: {
      id: table.id,
      name: table.name,
      status: table.status,
    },
    restaurant: {
      id: table.restaurant.id,
      name: table.restaurant.name,
      slug: table.restaurant.slug,

      logoUrl: table.restaurant.logoUrl,
      coverImageUrl: table.restaurant.coverImageUrl,

      tagline: table.restaurant.tagline,
      cuisineType: table.restaurant.cuisineType,

      themeColor: table.restaurant.themeColor,
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
    })),
    menuItems: menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,

      foodType: item.foodType,

      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,

      category: item.category
        ? {
            id: item.category.id,
            name: item.category.name,
          }
        : null,
    })),
  };
};

export const getOrder = async (
  qrToken: string,
  orderId: string,
) => {
  if (!qrToken) {
    throw new AppError("QR token is required", 400);
  }

  const table = await prisma.restaurantTable.findUnique({
    where: {
      qrCode: qrToken,
    },
  });

  if (!table) {
    throw new AppError("Invalid QR code", 404);
  }

  if (table.status === "INACTIVE") {
    throw new AppError("This table is inactive", 403);
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tableId: table.id,
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return {
    id: order.id,
    status: order.status,
    total: order.total,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      menuItem: {
        id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        foodType: item.menuItem.foodType,
      },
    })),
  };
};

export const getTableIdByQrToken = async (qrToken: string) => {
  const table = await prisma.restaurantTable.findUnique({
    where: {
      qrCode: qrToken,
    },
    select: {
      id: true,
    },
  });

  if (!table) {
    throw new AppError("Invalid QR code", 404);
  }

  return table.id;
};