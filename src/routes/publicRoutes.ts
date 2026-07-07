import { Router } from "express";

import {
  getPublicMenu,
  createPublicOrder,
  getPublicOrder,
} from "../controllers/publicController.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * /public/menu/{qrToken}:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get public menu
 *     description: Returns the public menu for a table using its QR token.
 *     parameters:
 *       - in: path
 *         name: qrToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu fetched successfully.
 *       403:
 *         description: Table is inactive.
 *       404:
 *         description: Invalid QR code.
 */
router.get(
  "/menu/:qrToken",
  asyncHandler(getPublicMenu),
);

/**
 * @swagger
 * /public/orders/{qrToken}:
 *   post:
 *     tags:
 *       - Public
 *     summary: Create public order
 *     description: Creates an order using a table QR code without authentication.
 *     parameters:
 *       - in: path
 *         name: qrToken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateOrderRequest"
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PublicOrderSummaryResponse"
 *       400:
 *         description: Validation error.
 *       403:
 *         description: Table is inactive.
 *       404:
 *         description: Invalid QR code.
 */
router.post(
  "/orders/:qrToken",
  asyncHandler(createPublicOrder),
);

/**
 * @swagger
 * /public/orders/{qrToken}/{orderId}:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get public order
 *     description: Returns the status of a previously placed public order.
 *     parameters:
 *       - in: path
 *         name: qrToken
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PublicOrderResponse"
 *       404:
 *         description: Order not found.
 */
router.get(
  "/orders/:qrToken/:orderId",
  asyncHandler(getPublicOrder),
);

export default router;