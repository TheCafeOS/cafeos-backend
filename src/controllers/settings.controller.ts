import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.js";
import * as settingsService from "../services/settings.service.js";

import { successResponse } from "../utils/apiResponse.js";

export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const settings = await settingsService.getSettings(
    req.employee!.restaurantId,
    req.employee!.id,
  );

  return res.json(
    successResponse(
      "Settings fetched successfully",
      settings,
    ),
  );
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const settings =
    await settingsService.updateSettings(
      req.employee!.restaurantId,
      req.employee!.id,
      req.body,
    );

  return res.json(
    successResponse(
      "Settings updated successfully",
      settings,
    ),
  );
};

export const uploadRestaurantLogo = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const settings =
    await settingsService.uploadRestaurantLogo(
      req.employee!.restaurantId,
      req.employee!.id,
      req.file,
    );

  return res.json(
    successResponse(
      "Restaurant logo uploaded successfully.",
      settings,
    ),
  );
};

export const uploadRestaurantCover = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const settings =
    await settingsService.uploadRestaurantCover(
      req.employee!.restaurantId,
      req.employee!.id,
      req.file,
    );

  return res.json(
    successResponse(
      "Restaurant cover uploaded successfully.",
      settings,
    ),
  );
};
