import { Router } from "express";

import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../controllers/menuController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../validations/menu.validation.js";
import { uploadMenuImage } from "../middleware/upload.js";
import { uploadMenuItemImage } from "../controllers/menuController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(listMenuItems),
);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(createMenuItemSchema),
  asyncHandler(createMenuItem),
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateMenuItemSchema),
  asyncHandler(updateMenuItem),
);

router.post(
  "/:id/image",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  uploadMenuImage.single("image"),
  asyncHandler(uploadMenuItemImage),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(deleteMenuItem),
);

export default router;