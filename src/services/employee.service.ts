import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  AuditAction,
  EmployeeRole,
  Prisma,
} from "@prisma/client";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import {
  getPaginationMeta,
  getPaginationParams,
} from "../utils/pagination.js";

const SALT_ROUNDS = 10;

export const employeeService = {
  async createEmployee(
    restaurantId: string,
    currentEmployeeId: string,
    data:{
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
    await auditService.log({
      restaurantId,
      employeeId: currentEmployeeId,

      action: AuditAction.EMPLOYEE_CREATED,

      entity: AuditEntity.Employee,
      entityId: employee.id,

      metadata: {
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });

    return employee;
  },

  async listEmployees(
    restaurantId: string,
    page?: string,
    limit?: string,
    search?: string,
    role?: EmployeeRole,
    isActive?: boolean,
  ) {
    const pagination = getPaginationParams(page, limit);
    const normalizedSearch = search?.trim();

    const where: Prisma.EmployeeWhereInput = {
      restaurantId,
      deletedAt: null,

      ...(normalizedSearch && {
        OR: [
          {
            name: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(role && {
        role,
      }),

      ...(isActive !== undefined && {
        isActive,
      }),
    };

    const [employees, totalItems] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
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
      }),

      prisma.employee.count({
        where,
      }),
    ]);

    return {
      data: employees,
      pagination: getPaginationMeta(
        pagination.page,
        pagination.limit,
        totalItems,
      ),
    };
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
    currentEmployeeId: string,
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

      await auditService.log({
      restaurantId,
      employeeId: currentEmployeeId,

      action: AuditAction.EMPLOYEE_UPDATED,

      entity: AuditEntity.Employee,
      entityId: updatedEmployee.id,

      metadata: {
        name: updatedEmployee.name,
        role: updatedEmployee.role,
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

      await auditService.log({
      restaurantId,
      employeeId: currentEmployeeId,

      action: AuditAction.EMPLOYEE_STATUS_CHANGED,

      entity: AuditEntity.Employee,
      entityId: updatedEmployee.id,

      metadata: {
        isActive: updatedEmployee.isActive,
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

    const deletedEmployee = await prisma.employee.update({
      where: {
        id: employee.id,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await auditService.log({
      restaurantId,
      employeeId: currentEmployeeId,

      action: AuditAction.EMPLOYEE_DELETED,

      entity: AuditEntity.Employee,
      entityId: deletedEmployee.id,

      metadata: {
        name: deletedEmployee.name,
        email: deletedEmployee.email,
      },
    });
  }
};

