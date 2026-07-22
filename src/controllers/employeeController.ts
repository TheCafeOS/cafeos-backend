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
    req.employee!.id,
    req.body,
  );

  return res.status(201).json(
    successResponse(
      "Employee created successfully.",
      employee,
    ),
  );
};

export const listEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result = await employeeService.listEmployees(
    req.employee!.restaurantId,
    req.query.page as string | undefined,
    req.query.limit as string | undefined,
    req.query.search as string | undefined,
  );

  return res.json(
    successResponse(
      "Employees fetched successfully.",
      result.data,
      result.pagination,
    ),
  );
};

export const getEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const employee = await employeeService.getEmployeeById(
    req.employee!.restaurantId,
    req.params.id as string,
  );

  return res.json(
    successResponse(
      "Employee fetched successfully.",
      employee,
    ),
  );
};

export const updateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const employee = await employeeService.updateEmployee(
    req.employee!.restaurantId,
    req.params.id as string,
    req.employee!.id,
    req.body,
  );

  return res.json(
    successResponse(
      "Employee updated successfully.",
      employee,
    ),
  );
};

export const updateEmployeeStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const employee = await employeeService.updateEmployeeStatus(
    req.employee!.restaurantId,
    req.params.id as string,
    req.employee!.id,
    req.body.isActive,
  );

  return res.json(
    successResponse(
      "Employee status updated successfully.",
      employee,
    ),
  );
};

export const deleteEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await employeeService.deleteEmployee(
    req.employee!.restaurantId,
    req.params.id as string,
    req.employee!.id,
  );

  return res.json(
    successResponse(
      "Employee deleted successfully.",
      null,
    ),
  );
};