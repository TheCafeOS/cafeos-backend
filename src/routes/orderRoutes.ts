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

/**
 * @swagger
 * /orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a restaurant order
 *     description: Creates a new order for a table in the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       500:
 *         description: Internal server error.
 */
router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(createOrderSchema),
  asyncHandler(createOrder),
);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List restaurant orders
 *     description: Returns paginated orders for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, status, total]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Orders fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(listOrdersSchema),
  asyncHandler(listOrders),
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Order not found.
 */
router.get(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(getOrder),
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Update order status
 *     description: Updates the status of an order owned by the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Order not found.
 *       409:
 *         description: Invalid order status transition.
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(updateOrderStatusSchema),
  asyncHandler(updateOrderStatus),
);

export default router;