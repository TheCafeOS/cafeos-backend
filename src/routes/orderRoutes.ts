import { Router } from "express";

import {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(createOrder),
);

router.get(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(listOrders),
);

router.get(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(getOrder),
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(updateOrderStatus),
);

export default router;