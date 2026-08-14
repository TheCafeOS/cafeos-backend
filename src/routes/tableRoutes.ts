import { Router } from "express";

import {
  createTable,
  deleteTable,
  downloadQr,
  listTables,
  updateTable,
  listTableMerges,
  getTableMerge,
  mergeTables,
  unmergeTables,
} from "../controllers/tableController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
  downloadQrSchema,
  mergeTablesSchema,
  tableMergeIdSchema,
} from "../validations/table.validation.js";

const router = Router();

/**
 * @swagger
 * /tables:
 *   get:
 *     tags:
 *       - Tables
 *     summary: List restaurant tables
 *     description: Returns all tables belonging to the authenticated restaurant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tables fetched successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get("/", requireAuth, asyncHandler(listTables));

/**
 * @swagger
 * /tables:
 *   post:
 *     tags:
 *       - Tables
 *     summary: Create a table
 *     description: Creates a new restaurant table.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateTableRequest"
 *     responses:
 *       201:
 *         description: Table created successfully.
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
  validate(createTableSchema),
  asyncHandler(createTable),
);

/**
 * @swagger
 * /tables/{id}:
 *   patch:
 *     tags:
 *       - Tables
 *     summary: Update a table
 *     description: Updates the name or status of a restaurant table.
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
 *             $ref: "#/components/schemas/UpdateTableRequest"
 *     responses:
 *       200:
 *         description: Table updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Table not found.
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(updateTableSchema),
  asyncHandler(updateTable),
);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     tags:
 *       - Tables
 *     summary: Delete a table
 *     description: Deletes a restaurant table.
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
 *         description: Table deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Table not found.
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER"),
  validate(deleteTableSchema),
  asyncHandler(deleteTable),
);

/**
 * @swagger
 * /tables/merge:
 *   post:
 *     tags:
 *       - Tables
 *     summary: Merge multiple tables
 *     description: Merges two or more restaurant tables into a single management and billing group. Existing non-cancelled orders are attached to the merge.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableIds
 *             properties:
 *               tableIds:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tables merged successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Table not found.
 *       409:
 *         description: One or more tables are already part of an active merge.
 */
router.get(
  "/merges",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  asyncHandler(listTableMerges),
);

router.get(
  "/merges/:mergeId",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(tableMergeIdSchema),
  asyncHandler(getTableMerge),
);

router.post(
  "/merges/:mergeId/unmerge",
  requireAuth,
  requireRole("OWNER", "MANAGER"),
  validate(tableMergeIdSchema),
  asyncHandler(unmergeTables),
);

/**
 * @swagger
 * /tables/{id}/qr:
 *   get:
 *     tags:
 *       - Tables
 *     summary: Download table QR code
 *     description: Downloads the PNG QR code for a restaurant table.
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
 *         description: PNG QR code.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Table not found.
 */
router.get(
  "/:id/qr",
  requireAuth,
  validate(downloadQrSchema),
  asyncHandler(downloadQr),
);

export default router;