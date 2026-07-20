import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as menuService from "../services/menu.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const listMenuItems = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const menuItems = await menuService.getMenuItems(
    req.employee!.restaurantId,
  );

  return res.json(
    successResponse(
      "Menu items fetched successfully",
      menuItems,
    ),
  );
};

export const createMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const menuItem = await menuService.addMenuItem(
    req.employee!.restaurantId,
    req.employee!.id,
    req.body,
  );

  return res.status(201).json(
    successResponse(
      "Menu item created successfully",
      menuItem,
    ),
  );
};

export const updateMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const menuItem = await menuService.editMenuItem(
    req.employee!.restaurantId,
    req.employee!.id,
    id,
    req.body,
  );

  return res.json(
    successResponse(
      "Menu item updated successfully",
      menuItem,
    ),
  );
};

export const deleteMenuItem = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  await menuService.removeMenuItem(
    req.employee!.restaurantId,
    req.employee!.id,
    id,
  );

  return res.json(
    successResponse(
      "Menu item deleted successfully",
      null,
    ),
  );
};

export const uploadMenuItemImage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const menuItem = await menuService.uploadMenuImage(
    req.employee!.restaurantId,
    id,
    req.file,
  );

  return res.json(
    successResponse(
      "Menu image uploaded successfully",
      menuItem,
    ),
  );
};