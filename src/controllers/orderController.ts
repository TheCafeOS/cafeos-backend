import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.js";
import * as orderService from "../services/order.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { tableId, customerPhone, items } = req.body;

  const order = await orderService.createRestaurantOrder(
    req.employee!.restaurantId,
    tableId,
    customerPhone ?? null,
    items,
  );

  return res.status(201).json(
    successResponse(
      "Order created successfully",
      order,
    ),
  );
};

export const listOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const orders = await orderService.getRestaurantOrders(
    req.employee!.restaurantId,
  );

  return res.json(
    successResponse(
      "Orders fetched successfully",
      orders,
    ),
  );
};

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const orderId = getRouteParam(req.params.id);

  const order = await orderService.getRestaurantOrder(
    req.employee!.restaurantId,
    orderId,
  );

  return res.json(
    successResponse(
      "Order fetched successfully",
      order,
    ),
  );
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const orderId = getRouteParam(req.params.id);

  const order = await orderService.updateOrderStatus(
    req.employee!.restaurantId,
    orderId,
    req.body.status,
  );

  return res.json(
    successResponse(
      "Order status updated successfully",
      order,
    ),
  );
};