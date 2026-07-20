import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import { EmployeeRole } from "@prisma/client";

import { listAuditLogs } from "../controllers/auditController.js";
import { listAuditLogsRequest } from "../validations/audit.validation.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole(EmployeeRole.OWNER),
  validate(listAuditLogsRequest),
  asyncHandler(listAuditLogs),
);

export default router;