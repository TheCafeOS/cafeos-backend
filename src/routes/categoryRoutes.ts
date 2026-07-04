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

router.get(
  "/",
  requireAuth,
  asyncHandler(listCategories),
);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(createCategorySchema),
  asyncHandler(createCategory),
);

router.put(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateCategorySchema),
  asyncHandler(updateCategory),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(deleteCategory),
);

export default router;