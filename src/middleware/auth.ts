import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  employee?: {
    id: string;
    restaurantId: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
    };

    const employee = await prisma.employee.findUnique({
      where: { id: decoded.sub },
      select: { id: true, restaurantId: true, email: true, role: true },
    });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.employee = employee;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
