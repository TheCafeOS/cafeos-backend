import { Router } from "express";

import {
  getTodayStats,
  getRecentOrders,
  getOrdersByStatus,
  getDashboardSummary,
  getActiveOrderSessions,
} from "../controllers/dashboardController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { recentOrdersSchema } from "../validations/dashboard.validation.js";

const router = Router();

/**
 * @swagger
 * /dashboard/today:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get today's dashboard statistics
 *     description: Returns today's revenue, total orders, completed orders and average order value for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully.
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/today",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(getTodayStats),
);

/**
 * @swagger
 * /dashboard/orders/status:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get order counts by status
 *     description: Returns the number of orders grouped by status for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order status breakdown fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/orders/status",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(getOrdersByStatus),
);

/**
 * @swagger
 * /dashboard/orders/active:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get active order sessions
 *     description: Returns active customer order sessions grouped by table and customer session. Two pending orders from the same session are presented as one combined session. Once either order is accepted, they are returned separately.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active order sessions fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/orders/active",
  requireAuth,
  requireRole(
    "OWNER",
    "MANAGER",
    "STAFF",
  ),
  asyncHandler(getActiveOrderSessions),
);

/**
 * @swagger
 * /dashboard/orders/recent:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get recent orders
 *     description: Returns the most recent orders for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recent orders to return.
 *     responses:
 *       200:
 *         description: Recent orders fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/orders/recent",
  requireAuth,
  requireRole("OWNER"),
  validate(recentOrdersSchema),
  asyncHandler(getRecentOrders),
);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard summary
 *     description: Returns today's statistics, order status breakdown and recent orders for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/summary",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  asyncHandler(getDashboardSummary),
);

export default router;