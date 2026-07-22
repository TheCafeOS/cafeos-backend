import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as categoryService from "../services/category.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const listCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result = await categoryService.getCategories(
    req.employee!.restaurantId,
    req.query.page as string | undefined,
    req.query.limit as string | undefined,
  );

  return res.json(
    successResponse(
      "Categories fetched successfully",
      result.data,
      result.pagination,
    ),
  );
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const category = await categoryService.addCategory(
    req.employee!.restaurantId,
    req.employee!.id,
    req.body.name,
  );

  return res.status(201).json(
    successResponse(
      "Category created successfully",
      category,
    ),
  );
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const category = await categoryService.editCategory(
    req.employee!.restaurantId,
    req.params.id as string,
    req.employee!.id,
    req.body.name,
  );

  return res.json(
    successResponse(
      "Category updated successfully",
      category,
    ),
  );
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  await categoryService.removeCategory(
    req.employee!.restaurantId,
    req.params.id as string,
    req.employee!.id,
  );

  return res.sendStatus(204);
};