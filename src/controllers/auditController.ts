import { Response } from "express";

import { auditService } from "../services/audit.service.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { successResponse } from "../utils/apiResponse.js";
import { getPaginationParams } from "../utils/pagination.js";

export const listAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { page, limit } = getPaginationParams(
    req.query.page as string | undefined,
    req.query.limit as string | undefined,
  );

  const result =
    await auditService.listLogs(
      req.employee!.restaurantId,
      page,
      limit,
      req.query.search as string | undefined,
    );

  return res.json(
    successResponse(
      "Audit logs fetched successfully.",
      result.data,
      result.pagination,
    ),
  );
};