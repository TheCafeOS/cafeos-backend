import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incomingId = req.header("X-Request-ID");

    const id =
    incomingId && incomingId.trim().length > 0
        ? incomingId
        : randomUUID();

    req.requestId = id;

    res.setHeader("X-Request-ID", id);

    next();
}