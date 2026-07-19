import bcrypt from "bcryptjs";
import { EmployeeRole } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 10;

export const employeeService = {
  async createEmployee(
    restaurantId: string,
    data: {
      name: string;
      email: string;
      password: string;
      role: EmployeeRole;
    },
  ) {
    const email = data.email.trim().toLowerCase();

    const existingEmployee = await prisma.employee.findUnique({
      where: {
        email,
      },
    });

    if (existingEmployee) {
      throw new AppError(
        "Employee with this email already exists.",
        409,
      );
    }

    const employee = await prisma.employee.create({
      data: {
        restaurantId,
        name: data.name.trim(),
        email,
        passwordHash: await bcrypt.hash(
          data.password,
          SALT_ROUNDS,
        ),
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return employee;
  },
};