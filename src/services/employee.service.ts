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

  async listEmployees(restaurantId: string) {
  return prisma.employee.findMany({
    where: {
      restaurantId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
},

async getEmployeeById(
  restaurantId: string,
  employeeId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      restaurantId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  return employee;
},

async updateEmployee(
  restaurantId: string,
  employeeId: string,
  data: {
    name?: string;
    role?: EmployeeRole;
  },
) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      restaurantId,
      deletedAt: null,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  if (employee.role === EmployeeRole.OWNER) {
    throw new AppError("Owner account cannot be modified.", 403);
  }

  const updatedEmployee = await prisma.employee.update({
    where: {
      id: employee.id,
    },
    data: {
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),
      ...(data.role !== undefined && {
        role: data.role,
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedEmployee;
},

async updateEmployeeStatus(
  restaurantId: string,
  employeeId: string,
  currentEmployeeId: string,
  isActive: boolean,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      restaurantId,
      deletedAt: null,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  if (employee.role === EmployeeRole.OWNER) {
    throw new AppError("Owner account cannot be deactivated.", 403);
  }

  if (employee.id === currentEmployeeId) {
    throw new AppError("You cannot change your own account status.", 403);
  }

  const updatedEmployee = await prisma.employee.update({
    where: {
      id: employee.id,
    },
    data: {
      isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedEmployee;
},

async deleteEmployee(
  restaurantId: string,
  employeeId: string,
  currentEmployeeId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      restaurantId,
      deletedAt: null,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  if (employee.role === EmployeeRole.OWNER) {
    throw new AppError("Owner account cannot be deleted.", 403);
  }

  if (employee.id === currentEmployeeId) {
    throw new AppError("You cannot delete your own account.", 403);
  }

  await prisma.employee.update({
    where: {
      id: employee.id,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
},

};

