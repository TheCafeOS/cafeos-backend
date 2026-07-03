import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = Router();

router.get("/", requireAuth, listCategories);

router.post(
  "/",
  requireAuth,
  validate(createCategorySchema),
  createCategory,
);

router.put(
  "/:id",
  requireAuth,
  validate(updateCategorySchema),
  updateCategory,
);

router.delete("/:id", requireAuth, deleteCategory);

export default router;