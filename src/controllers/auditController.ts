import { Response } from "express";

import { auditService } from "../services/audit.service.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { successResponse } from "../utils/apiResponse.js";

export const listAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { page, limit } = req.query as {
    page: string;
    limit: string;
  };

  const result = await auditService.listLogs(
    req.employee!.restaurantId,
    Number(page ?? 1),
    Number(limit ?? 20),
  );

  return res.json(
    successResponse(
      "Audit logs fetched successfully.",
      result,
    ),
  );
};