import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const generateSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "restaurant";

const buildUniqueSlug = async (restaurantName: string): Promise<string> => {
  const baseSlug = generateSlug(restaurantName);

  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  return slug;
};

const generateToken = (employeeId: string): string =>
  jwt.sign(
    { sub: employeeId },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

export const authService = {
  async register(data: {
    restaurantName: string;
    restaurantEmail: string;
    restaurantPhone?: string;
    address?: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
  }) {
    const {
      restaurantName,
      restaurantEmail,
      restaurantPhone,
      address,
      ownerName,
      ownerEmail,
      password,
    } = data;

    if (
      !restaurantName ||
      !restaurantEmail ||
      !restaurantPhone ||
      !address ||
      !ownerName ||
      !ownerEmail ||
      !password
    ) {
      throw new AppError("Missing required fields", 400);
    }

    const normalizedRestaurantEmail = restaurantEmail.trim().toLowerCase();
    const normalizedOwnerEmail = ownerEmail.trim().toLowerCase();

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: normalizedOwnerEmail },
    });

    if (existingEmployee) {
      throw new AppError(
        "An account with this owner email already exists.",
        409,
      );
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
            role: "OWNER",
          },
        },
      },
    });

    const employee = await prisma.employee.findFirst({
      where: {
        restaurantId: restaurant.id,
        email: normalizedOwnerEmail,
      },
      select: {
        id: true,
        restaurantId: true,
        email: true,
        role: true,
      },
    });

    if (!employee) {
      throw new AppError("Registration failed", 500);
    }

    return {
      token: generateToken(employee.id),
      employee,
      restaurant,
    };
  },

  async login(data: {
    email: string;
    password: string;
  }) {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError(
        "Email and password are required",
        400,
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!employee) {
      throw new AppError("Invalid credentials", 401);
    }

    const validPassword = await bcrypt.compare(
      password,
      employee.passwordHash,
    );

    if (!validPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    return {
      token: generateToken(employee.id),
      employee: {
        id: employee.id,
        restaurantId: employee.restaurantId,
        email: employee.email,
        role: employee.role,
      },
    };
  },
};