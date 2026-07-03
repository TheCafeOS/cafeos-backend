import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as categoryService from "../services/category.service.js";

export const listCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const categories = await categoryService.getCategories(
    req.employee!.restaurantId,
  );

  return res.json(categories);
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const category = await categoryService.addCategory(
    req.employee!.restaurantId,
    req.body.name,
  );

  return res.status(201).json(category);
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const category = await categoryService.editCategory(
    req.employee!.restaurantId,
    id,
    req.body.name,
  );

  if (!category) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  return res.json(category);
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const deleted = await categoryService.removeCategory(
    req.employee!.restaurantId,
    id,
  );

  if (!deleted) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  return res.sendStatus(204);
};