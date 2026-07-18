import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validations/settings.validation.js";
import { uploadImage } from "../middleware/upload.js";
import {
  getSettings,
  updateSettings,
  uploadRestaurantLogo,
  uploadRestaurantCover,
} from "../controllers/settings.controller.js";

const router = Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get restaurant settings
 *     description: Returns the current restaurant branding and settings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully.
 *       401:
 *         description: Unauthorized.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(getSettings),
);

/**
 * @swagger
 * /settings:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Update restaurant settings
 *     description: Updates restaurant branding information such as name, contact details, theme color and social links.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SettingsUpdateRequest"
 *     responses:
 *       200:
 *         description: Settings updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
  "/",
  requireAuth,
  validate(updateSettingsSchema),
  asyncHandler(updateSettings),
);

/**
 * @swagger
 * /settings/logo:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Upload restaurant logo
 *     description: Uploads or replaces the restaurant logo.
 *     security:
 *       - bearerAuth: []
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
 *         description: Restaurant logo uploaded successfully.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
  "/logo",
  requireAuth,
  uploadImage.single("image"),
  asyncHandler(uploadRestaurantLogo),
);

/**
 * @swagger
 * /settings/cover:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Upload restaurant cover image
 *     description: Uploads or replaces the restaurant cover image.
 *     security:
 *       - bearerAuth: []
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
 *         description: Restaurant cover uploaded successfully.
 *       400:
 *         description: Invalid request.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
  "/cover",
  requireAuth,
  uploadImage.single("image"),
  asyncHandler(uploadRestaurantCover),
);

export default router;