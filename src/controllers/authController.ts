import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from "../config/env.js";

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'restaurant';

const buildUniqueSlug = async (restaurantName: string) => {
  const baseSlug = generateSlug(restaurantName);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      restaurantName,
      restaurantEmail,
      restaurantPhone,
      address,
      ownerName,
      ownerEmail,
      password,
    } = req.body;

    if (!restaurantName || !restaurantEmail || !restaurantPhone || !address || !ownerName || !ownerEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const normalizedRestaurantEmail = String(restaurantEmail).trim().toLowerCase();
    const normalizedOwnerEmail = String(ownerEmail).trim().toLowerCase();

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: normalizedOwnerEmail },
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'An account with this owner email already exists.',
      });
    }

    const slug = await buildUniqueSlug(restaurantName);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        restaurantEmail: normalizedRestaurantEmail,
        phone: restaurantPhone,
        address,
        employees: {
          create: {
            name: ownerName,
            email: normalizedOwnerEmail,
            passwordHash: await bcrypt.hash(password, 10),
            role: 'OWNER',
          },
        },
      },
    });

    const employee = await prisma.employee.findFirst({
      where: { restaurantId: restaurant.id, email: normalizedOwnerEmail },
      select: { id: true, restaurantId: true, email: true, role: true },
    });

    if (!employee) {
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }

    const token = jwt.sign({ sub: employee.id }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully.',
      data: {
        token,
        employee,
        restaurant,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
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

    const token = jwt.sign({ sub: employee.id }, env.JWT_SECRET, {
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
