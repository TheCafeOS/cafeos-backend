import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireRole } from "../middleware/authorize.js";
import {
  getCustomer,
  getProgram,
  redeemReward,
  upsertProgram,
} from "../controllers/loyaltyController.js";
import {
  loyaltyProgramSchema,
  loyaltyRedeemSchema,
  loyaltyCustomerSchema,
} from "../validations/loyalty.validation.js";

const router = Router();

/**
 * @swagger
 * /loyalty/program:
 *   put:
 *     tags:
 *       - Loyalty
 *     summary: Configure loyalty program
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoyaltyProgramRequest'
 *     responses:
 *       200:
 *         description: Loyalty program updated successfully.
 */
router.put("/program", requireAuth, requireRole("OWNER", "MANAGER"), validate(loyaltyProgramSchema), asyncHandler(upsertProgram));

/**
 * @swagger
 * /loyalty/program:
 *   get:
 *     tags:
 *       - Loyalty
 *     summary: Get loyalty program
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty program fetched successfully.
 */
router.get("/program", requireAuth, requireRole("OWNER", "MANAGER", "STAFF"), asyncHandler(getProgram));

/**
 * @swagger
 * /loyalty/customers/{phone}:
 *   get:
 *     tags:
 *       - Loyalty
 *     summary: Get loyalty customer profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer loyalty profile fetched successfully.
 */
router.get("/customers/:phone", requireAuth, requireRole("OWNER", "MANAGER", "STAFF"), validate(loyaltyCustomerSchema), asyncHandler(getCustomer));

/**
 * @swagger
 * /loyalty/customers/{customerId}/rewards/{rewardId}/redeem:
 *   post:
 *     tags:
 *       - Loyalty
 *     summary: Redeem a reward
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward redeemed successfully.
 */
router.post("/customers/:customerId/rewards/:rewardId/redeem", requireAuth, requireRole("OWNER", "MANAGER", "STAFF"), validate(loyaltyRedeemSchema), asyncHandler(redeemReward));

export default router;
