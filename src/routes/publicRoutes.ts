import { Router } from "express";

import {
  getPublicMenu,
  createPublicOrder,
  getPublicOrder,
  getPublicLoyaltyProgram,
  getPublicCustomerLoyalty,
} from "../controllers/publicController.js";

import {
  publicMenuSchema,
  publicLoyaltyProgramSchema,
  publicCustomerLoyaltySchema,
  publicOrderDetailsSchema,
} from "../validations/public.validation.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";

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
  validate(publicMenuSchema),
  asyncHandler(getPublicMenu),
);

/**
 * @swagger
 * /public/loyalty/program/{qrToken}:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get public loyalty program
 *     description: Returns the active loyalty program for the restaurant identified by the QR code.
 *     parameters:
 *       - in: path
 *         name: qrToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loyalty program fetched successfully.
 *       404:
 *         description: Invalid QR code or loyalty program not available.
 */
router.get(
  "/loyalty/program/:qrToken",
  validate(publicLoyaltyProgramSchema),
  asyncHandler(getPublicLoyaltyProgram),
);

/**
 * @swagger
 * /public/loyalty/customer/{qrToken}/{phone}:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get customer loyalty profile
 *     description: Returns the loyalty progress for a customer identified by phone number for the restaurant associated with the QR code.
 *     parameters:
 *       - in: path
 *         name: qrToken
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer loyalty profile fetched successfully.
 *       404:
 *         description: Invalid QR code or customer not found.
 */
router.get(
  "/loyalty/customer/:qrToken/:phone",
  validate(publicCustomerLoyaltySchema),
  asyncHandler(getPublicCustomerLoyalty),
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
  validate(publicMenuSchema),
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
  validate(publicOrderDetailsSchema),
  asyncHandler(getPublicOrder),
);

export default router;