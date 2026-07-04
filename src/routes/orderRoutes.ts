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
import { validate } from "../middleware/validate.js";

import {
  createOrderSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
} from "../validations/order.validation.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(createOrderSchema),
  asyncHandler(createOrder),
);

router.get(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(listOrdersSchema),
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
  validate(updateOrderStatusSchema),
  asyncHandler(updateOrderStatus),
);

export default router;