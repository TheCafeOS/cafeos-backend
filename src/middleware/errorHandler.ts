import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { errorResponse } from "../utils/apiResponse.js";
import { logger } from "../lib/logger.js";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.message));
  }

  logger.error(err);

  return res
    .status(500)
    .json(errorResponse("Internal Server Error"));
};