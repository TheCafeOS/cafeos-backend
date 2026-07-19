import { Router } from "express";

import { createEmployee } from "../controllers/employeeController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import { createEmployeeSchema } from "../validations/employee.validation.js";

const router = Router();

/**
 * @swagger
 * /employees:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create employee
 *     description: Creates a new employee for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Sharma
 *               email:
 *                 type: string
 *                 example: rahul@example.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               role:
 *                 type: string
 *                 enum:
 *                   - MANAGER
 *                   - STAFF
 *     responses:
 *       201:
 *         description: Employee created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       409:
 *         description: Employee already exists.
 */
router.post(
  "/",
  requireAuth,
  requireRole("OWNER"),
  validate(createEmployeeSchema),
  asyncHandler(createEmployee),
);

export default router;