import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "./auth.js";
import { AppError } from "../utils/AppError.js";

export const requireRole =
  (...roles: string[]) =>
  (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!req.employee) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!roles.includes(req.employee.role)) {
      return next(new AppError("Forbidden", 403));
    }

    next();
  };