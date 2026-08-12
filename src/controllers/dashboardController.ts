import { Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";
import * as orderService from "../services/order.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getTodayStats = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const stats =
    await dashboardService.getTodayStats(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Today's dashboard statistics fetched successfully",
      stats,
    ),
  );
};

export const getRecentOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const limit = Math.min(
    Number(req.query.limit) || 10,
    50,
  );
  
  const orders = await dashboardService.getRecentOrders(
    req.employee!.restaurantId,
    req.query.limit as number | undefined,
  );

  return res.json(
    successResponse(
      "Recent orders fetched successfully",
      orders,
    ),
  );
};

export const getOrdersByStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data =
    await dashboardService.getOrdersByStatus(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Order status breakdown fetched successfully",
      data,
    ),
  );
};

export const getDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const summary =
    await dashboardService.getDashboardSummary(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Dashboard summary fetched successfully",
      summary,
    ),
  );
};

export const getActiveOrderSessions = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sessions =
    await orderService.getActiveOrderSessions(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Active order sessions fetched successfully",
      sessions,
    ),
  );
};


