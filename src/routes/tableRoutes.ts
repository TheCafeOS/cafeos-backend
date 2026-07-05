import { Router } from "express";

import {
  createTable,
  deleteTable,
  downloadQr,
  listTables,
  updateTable,
} from "../controllers/tableController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createTableSchema,
  updateTableSchema,
} from "../validations/table.validation.js";

const router = Router();

router.get("/", requireAuth, listTables);

router.post(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(createTableSchema),
  asyncHandler(createTable),
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateTableSchema),
  asyncHandler(updateTable),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  asyncHandler(deleteTable),
);

router.get(
  "/:id/qr",
  requireAuth,
  asyncHandler(downloadQr),
);

export default router;