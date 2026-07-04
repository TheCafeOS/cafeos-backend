import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation.js";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new restaurant
 *     description: Creates a restaurant along with its owner account.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             restaurantName: CafeOS Demo
 *             ownerName: John Doe
 *             email: owner@example.com
 *             password: StrongPassword123!
 *     responses:
 *       201:
 *         description: Restaurant registered successfully.
 *       400:
 *         description: Validation failed.
 *       409:
 *         description: Restaurant or email already exists.
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(register),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Employee login
 *     description: Authenticates an employee and returns a JWT access token.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: owner@example.com
 *             password: StrongPassword123!
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Invalid credentials.
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(login),
);

export default router;