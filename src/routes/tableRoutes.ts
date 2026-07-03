import { Router } from "express";
import {
  createTable,
  deleteTable,
  listTables,
  updateTable,
} from "../controllers/tableController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTableSchema,
  updateTableSchema,
} from "../validations/table.validation.js";

const router = Router();

router.get("/", requireAuth, listTables);

router.post(
  "/",
  requireAuth,
  validate(createTableSchema),
  createTable,
);

router.put(
  "/:id",
  requireAuth,
  validate(updateTableSchema),
  updateTable,
);

router.delete("/:id", requireAuth, deleteTable);

export default router;