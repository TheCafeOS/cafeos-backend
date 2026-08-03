import { Router } from "express";

import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
  uploadMenuItemImage,
} from "../controllers/menuController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { uploadImage } from "../middleware/upload.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createMenuItemSchema,
  updateMenuItemSchema,
  uploadMenuImageSchema,
  deleteMenuItemSchema,
} from "../validations/menu.validation.js";

const router = Router();

/**
 * @swagger
 * /menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: List menu items
 *     description: Returns all menu items for the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu items fetched successfully.
 *       401:
 *         description: Unauthorized.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(listMenuItems),
);

/**
 * @swagger
 * /menu:
 *   post:
 *     tags:
 *       - Menu
 *     summary: Create menu item
 *     description: Creates a new menu item.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateMenuItemRequest"
 *     responses:
 *       201:
 *         description: Menu item created successfully.
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
  validate(createMenuItemSchema),
  asyncHandler(createMenuItem),
);

/**
 * @swagger
 * /menu/{id}:
 *   patch:
 *     tags:
 *       - Menu
 *     summary: Update menu item
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
 *             $ref: "#/components/schemas/UpdateMenuItemRequest"
 *     responses:
 *       200:
 *         description: Menu item updated successfully.
 *       404:
 *         description: Menu item not found.
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateMenuItemSchema),
  asyncHandler(updateMenuItem),
);

/**
 * @swagger
 * /menu/{id}/image:
 *   post:
 *     tags:
 *       - Menu
 *     summary: Upload menu item image
 *     description: Uploads or replaces a menu item image.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully.
 *       400:
 *         description: Invalid image.
 *       404:
 *         description: Menu item not found.
 */
router.post(
  "/:id/image",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(uploadMenuImageSchema),
  uploadImage.single("image"),
  asyncHandler(uploadMenuItemImage),
);

/**
 * @swagger
 * /menu/{id}:
 *   delete:
 *     tags:
 *       - Menu
 *     summary: Delete menu item
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
 *         description: Menu item deleted successfully.
 *       404:
 *         description: Menu item not found.
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  validate(deleteMenuItemSchema),
  asyncHandler(deleteMenuItem),
);

export default router;