import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import * as orderService from "../services/order.service.js";

export const getPublicMenu = async (
  req: Request,
  res: Response,
) => {
  try {
    const qrToken = Array.isArray(req.params.qrToken)
    ? req.params.qrToken[0]
    : req.params.qrToken;

    if (!qrToken) {
      return res.status(400).json({
        message: "QR token is required",
      });
    }

    const table = await prisma.restaurantTable.findUnique({
      where: {
        qrCode: `/qr/${qrToken}`,
      },
      include: {
        restaurant: true,
      },
    });

    if (!table) {
      return res.status(404).json({
        message: "Invalid QR code",
      });
    }

    if (table.status === "INACTIVE") {
      return res.status(403).json({
        message: "This table is inactive",
      });
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: table.restaurantId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const menuItems = await prisma.menuItem.findMany({
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
    });

    return res.json({
      table: {
        id: table.id,
        name: table.name,
        status: table.status,
      },
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        slug: table.restaurant.slug,
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
        imageUrl: item.imageUrl,
        categoryId: item.categoryId,
        category: item.category
          ? {
              id: item.category.id,
              name: item.category.name,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch menu",
    });
  }
};

export const createPublicOrder = async (
  req: Request,
  res: Response,
) => {
  try {
    const { customerPhone, items } = req.body;

    const qrToken = Array.isArray(req.params.qrToken)
    ? req.params.qrToken[0]
    : req.params.qrToken;

    const order = await orderService.createPublicOrder(
    qrToken,
    customerPhone ?? null,
    items,
    );

    return res.status(201).json({
      id: order.id,
      status: order.status,
      total: order.total,
      table: order.table.name,
      createdAt: order.createdAt,
    });
  } catch (error) {
    switch ((error as Error).message) {
      case "INVALID_QR":
        return res.status(404).json({
          message: "Invalid QR code",
        });

      case "TABLE_INACTIVE":
        return res.status(403).json({
          message: "This table is inactive",
        });

      case "EMPTY_ORDER":
        return res.status(400).json({
          message: "Items are required",
        });

      case "INVALID_MENU_ITEMS":
        return res.status(400).json({
          message: "One or more menu items are invalid",
        });

      case "INVALID_QUANTITY":
        return res.status(400).json({
          message: "Quantity must be at least 1",
        });

      default:
        console.error(error);

        return res.status(500).json({
          message: "Failed to create order",
        });
    }
  }
};

export const getPublicOrder = async (
  req: Request,
  res: Response,
) => {
  try {
    const qrToken = Array.isArray(req.params.qrToken)
    ? req.params.qrToken[0]
    : req.params.qrToken;

    const orderId = Array.isArray(req.params.orderId)
    ? req.params.orderId[0]
    : req.params.orderId;

    const table = await prisma.restaurantTable.findUnique({
      where: {
        qrCode: `/qr/${qrToken}`,
      },
    });

    if (!table) {
      return res.status(404).json({
        message: "Invalid QR code",
      });
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
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
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
        },
      })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};