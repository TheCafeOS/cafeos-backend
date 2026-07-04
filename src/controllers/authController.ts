import { Request, Response } from "express";

import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";

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