import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from '../lib/prisma.js';

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
    const decoded = verifyAccessToken(token);

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
