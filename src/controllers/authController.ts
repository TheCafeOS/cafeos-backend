import { Request, Response } from "express";

import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

export const register = async (
  req: Request,
  res: Response,
) => {
  const result = await authService.register(req.body);

  return res.status(201).json(
    successResponse(
      "Restaurant registered successfully.",
      result,
    ),
  );
};

export const login = async (
  req: Request,
  res: Response,
) => {
  const result = await authService.login(req.body);

  return res.json(
    successResponse(
      "Login successful.",
      result,
    ),
  );
};

export const refresh = async (
  req: Request,
  res: Response,
) => {
  const result =
    await authService.refresh(
      req.body.refreshToken,
    );

  return res.json(
    successResponse(
      "Access token refreshed.",
      result,
    ),
  );
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await authService.changePassword(
    req.employee!.id,
    req.body.currentPassword,
    req.body.newPassword,
  );

  return res.json(
    successResponse(
      "Password changed successfully",
    ),
  );
};