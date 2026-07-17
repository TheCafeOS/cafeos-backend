import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { env } from "../config/env.js";

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

const SALT_ROUNDS = 10;

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

    if (!env.ALLOW_PUBLIC_REGISTRATION) {
      throw new AppError(
        "Registration is disabled. Please contact CafeOS to onboard your restaurant.",
        403,
      );
    }
    
    const {
      restaurantName,
      restaurantEmail,
      restaurantPhone,
      address,
      ownerName,
      ownerEmail,
      password,
    } = data;

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
            passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
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
      accessToken: generateAccessToken(employee.id),
      refreshToken: generateRefreshToken(employee.id),
      employee,
      restaurant,
    };
  },

  async login(data: {
    email: string;
    password: string;
  }) {
    const { email, password } = data;

    const employee = await prisma.employee.findUnique({
      where: { email: email.trim().toLowerCase() },
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
      accessToken: generateAccessToken(employee.id),
      refreshToken: generateRefreshToken(employee.id),
      employee: {
        id: employee.id,
        restaurantId: employee.restaurantId,
        email: employee.email,
        role: employee.role,
      },
    };
  },

    async refresh(refreshToken: string) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid refresh token", 401);
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
      },
    });

    if (!employee) {
      throw new AppError("Invalid refresh token", 401);
    }

    return {
      accessToken: generateAccessToken(employee.id),
    };
  },

  async getEmployeeForSocket(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
    select: {
      restaurantId: true,
    },
  });

  if (!employee) {
    throw new AppError("Unauthorized", 401);
  }

  return employee;
},

async changePassword(
  employeeId: string,
  currentPassword: string,
  newPassword: string,
) {
  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  const validPassword = await bcrypt.compare(
    currentPassword,
    employee.passwordHash,
  );

  if (!validPassword) {
    throw new AppError("Current password is incorrect", 401);
  }

  await prisma.employee.update({
    where: {
      id: employeeId,
    },
    data: {
      passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS),
    },
  });
},

async getAuthenticatedEmployee(employeeId: string){
  return prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      restaurantId: true,
      email: true,
      role: true,
    },
  });
}
};
