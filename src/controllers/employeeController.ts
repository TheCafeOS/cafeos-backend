import { Response } from "express";

import { employeeService } from "../services/employee.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const employee = await employeeService.createEmployee(
    req.employee!.restaurantId,
    req.body,
  );

  return res.status(201).json(
    successResponse(
      "Employee created successfully.",
      employee,
    ),
  );
};