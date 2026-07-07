import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List categories
 *     description: Returns all menu categories for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(listCategories),
);

/**
 * @swagger
 * /categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create category
 *     description: Creates a new menu category.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateCategoryRequest"
 *     responses:
 *       201:
 *         description: Category created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(createCategorySchema),
  asyncHandler(createCategory),
);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     tags:
 *       - Categories
 *     summary: Update category
 *     description: Updates an existing menu category.
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
 *             $ref: "#/components/schemas/UpdateCategoryRequest"
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateCategorySchema),
  asyncHandler(updateCategory),
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete category
 *     description: Deletes a menu category.
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
 *         description: Category deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(deleteCategory),
);

export default router;