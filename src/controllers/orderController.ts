import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as orderService from "../services/order.service.js";

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { tableId, customerPhone, items } = req.body;

    const order = await orderService.createRestaurantOrder(
      req.employee!.restaurantId,
      tableId,
      customerPhone ?? null,
      items,
    );

    return res.status(201).json(order);
  } catch (error) {
    switch ((error as Error).message) {
      case "TABLE_NOT_FOUND":
        return res.status(404).json({
          message: "Table not found",
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
          message: "Invalid quantity",
        });

      default:
        console.error(error);
        return res.status(500).json({
          message: "Failed to create order",
        });
    }
  }
};

export const listOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const orders = await orderService.getRestaurantOrders(
      req.employee!.restaurantId,
    );

    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const order = await orderService.getRestaurantOrder(
      req.employee!.restaurantId,
      id,
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { status } = req.body;

    const order = await orderService.updateOrderStatus(
      req.employee!.restaurantId,
      id,
      status,
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update order status",
    });
  }
};