import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.js";
import * as orderService from "../services/order.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { getPaginationParams } from "../utils/pagination.js";
import { getRouteParam } from "../utils/request.js";
import { OrderStatus } from "../utils/orderStatus.js";

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { tableId, customerPhone, items } = req.body;

  const order = await orderService.createRestaurantOrder(
    req.employee!.restaurantId,
    req.employee!.id,
    tableId,
    customerPhone,
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
  const { page, limit } = getPaginationParams(
    req.query.page as string | undefined,
    req.query.limit as string | undefined,
  );

  const result =
    await orderService.getRestaurantOrders(
      req.employee!.restaurantId,
      page,
      limit,
      {
        status: req.query.status as OrderStatus | undefined,
        tableId: req.query.tableId as string | undefined,
        search: req.query.search as string | undefined,
        from: req.query.from as Date | undefined,
        to: req.query.to as Date | undefined,
        sort: req.query.sort as
          | "createdAt"
          | "status"
          | "total"
          | undefined,
        order: req.query.order as
          | "asc"
          | "desc"
          | undefined,
      },
    );

  return res.json(
    successResponse(
      "Orders fetched successfully",
      result.data,
      result.pagination,
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

  const { status: orderStatus } = req.body;

  const order =
    await orderService.updateOrderStatus(
      req.employee!.restaurantId,
      req.employee!.id,
      orderId,
      orderStatus as OrderStatus,
    );

  return res.json(
    successResponse(
      "Order status updated successfully",
      order,
    ),
  );
};