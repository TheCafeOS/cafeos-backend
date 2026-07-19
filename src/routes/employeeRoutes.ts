import { Router } from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "../controllers/employeeController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createEmployeeRequest,
  deleteEmployeeRequest,
  getEmployeeRequest,
  updateEmployeeRequest,
  updateEmployeeStatusRequest,
} from "../validations/employee.validation.js";

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
  validate(createEmployeeRequest),
  asyncHandler(createEmployee),
);


/**
 * @swagger
 * /employees:
 *   get:
 *     tags:
 *       - Employees
 *     summary: List employees
 *     description: Returns all employees for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  "/",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(listEmployees),
);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get employee
 *     description: Returns details of a specific employee.
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
 *         description: Employee fetched successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Employee not found.
 */
router.get(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  validate(getEmployeeRequest),
  asyncHandler(getEmployee),
);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     tags:
 *       - Employees
 *     summary: Update employee
 *     description: Updates an employee's name or role.
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum:
 *                   - MANAGER
 *                   - STAFF
 *     responses:
 *       200:
 *         description: Employee updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Employee not found.
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  validate(updateEmployeeRequest),
  asyncHandler(updateEmployee),
);

/**
 * @swagger
 * /employees/{id}/status:
 *   patch:
 *     tags:
 *       - Employees
 *     summary: Update employee status
 *     description: Activate or deactivate an employee.
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
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Employee status updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Employee not found.
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("OWNER"),
  validate(updateEmployeeStatusRequest),
  asyncHandler(updateEmployeeStatus),
);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     tags:
 *       - Employees
 *     summary: Delete employee
 *     description: Soft deletes an employee.
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
 *         description: Employee deleted successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Employee not found.
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  validate(deleteEmployeeRequest),
  asyncHandler(deleteEmployee),
);

export default router;