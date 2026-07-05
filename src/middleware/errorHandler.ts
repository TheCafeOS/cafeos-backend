import { NextFunction, Request, Response } from "express";

import { logger } from "../lib/logger.js";

import { AppError } from "../utils/AppError.js";
import { errorResponse } from "../utils/apiResponse.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({
    err,
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ...errorResponse(err.message),
      requestId: req.requestId,
    });
  }

  return res.status(500).json({
    ...errorResponse("Internal Server Error"),
    requestId: req.requestId,
  });
};