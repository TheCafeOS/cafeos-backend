import { Router } from "express";

import {
  getTodayStats,
  getRecentOrders,
  getOrdersByStatus,
  getDashboardSummary,
} from "../controllers/dashboardController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { recentOrdersSchema } from "../validations/dashboard.validation.js";

const router = Router();

router.get(
  "/today",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(getTodayStats),
);

router.get(
  "/orders/status",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(getOrdersByStatus),
);

router.get(
  "/orders/recent",
  requireAuth,
  requireRole("OWNER"),
  validate(recentOrdersSchema),
  asyncHandler(getRecentOrders),
);

router.get(
  "/summary",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(getDashboardSummary),
);

export default router;