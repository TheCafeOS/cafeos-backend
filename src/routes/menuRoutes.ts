import { Router } from "express";
import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../controllers/menuController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../validations/menu.validation.js";

const router = Router();

router.get("/", requireAuth, listMenuItems);

router.post(
  "/",
  requireAuth,
  validate(createMenuItemSchema),
  createMenuItem,
);

router.put(
  "/:id",
  requireAuth,
  validate(updateMenuItemSchema),
  updateMenuItem,
);

router.delete("/:id", requireAuth, deleteMenuItem);

export default router;