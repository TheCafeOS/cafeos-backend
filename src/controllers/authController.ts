import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { restaurantName, slug, ownerName, email, password, phone, address } = req.body;

    if (!restaurantName || !slug || !ownerName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        phone,
        address,
        employees: {
          create: {
            name: ownerName,
            email,
            passwordHash: await bcrypt.hash(password, 10),
            role: 'OWNER',
          },
        },
      },
    });

    const employee = await prisma.employee.findFirst({
      where: { restaurantId: restaurant.id, email },
      select: { id: true, restaurantId: true, email: true, role: true },
    });

    const token = jwt.sign({ sub: employee?.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      employee,
      restaurant,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, employee.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: employee.id }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      employee: {
        id: employee.id,
        restaurantId: employee.restaurantId,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
};
