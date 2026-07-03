import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as menuService from "../services/menu.service.js";

export const listMenuItems = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const menuItems = await menuService.getMenuItems(
    req.employee!.restaurantId,
  );

  return res.json(menuItems);
};

export const createMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const menuItem = await menuService.addMenuItem(
    req.employee!.restaurantId,
    req.body,
  );

  return res.status(201).json(menuItem);
};

export const updateMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const menuItem = await menuService.editMenuItem(
    req.employee!.restaurantId,
    id,
    req.body,
  );

  if (!menuItem) {
    return res.status(404).json({
      message: "Menu item not found",
    });
  }

  return res.json(menuItem);
};

export const deleteMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const deleted = await menuService.removeMenuItem(
    req.employee!.restaurantId,
    id,
  );

  if (!deleted) {
    return res.status(404).json({
      message: "Menu item not found",
    });
  }

  return res.sendStatus(204);
};