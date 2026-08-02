import { Request, NextFunction } from 'express';
import { verifyAccessToken } from "../utils/jwt.js";
import { authService } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import type { EmployeeRole } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  employee?: {
    id: string;
    restaurantId: string;
    email: string;
    role: EmployeeRole;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  _: unknown,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid token", 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyAccessToken(token);

    const employee = await authService.getAuthenticatedEmployee(decoded.sub);

    if (!employee) {
      return next(new AppError("Invalid token", 401));
    }

    if (employee.deletedAt || !employee.isActive) {
      return next(new AppError("Unauthorized", 401));
    }

    req.employee = employee;
    next();
  } catch (error) {
      return next(
        error instanceof AppError
          ? error
          : new AppError("Invalid token", 401),
      );
    }
};
