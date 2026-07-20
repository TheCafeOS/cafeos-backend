import { AuditAction } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";

export const getCategories = async (restaurantId: string) => {
  return prisma.category.findMany({
    where: {
      restaurantId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addCategory = async (
  restaurantId: string,
  currentEmployeeId: string,
  name: string,
) => {
  const category = await prisma.category.create({
    data: {
      restaurantId,
      name,
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.CATEGORY_CREATED,

    entity: AuditEntity.Category,
    entityId: category.id,

    metadata: {
      name: category.name,
    },
  });

  return category;
};

export const editCategory = async (
  restaurantId: string,
  id: string,
  currentEmployeeId: string,
  name: string,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.CATEGORY_UPDATED,

    entity: AuditEntity.Category,
    entityId: updatedCategory.id,

    metadata: {
      previousName: category.name,
      newName: updatedCategory.name,
    },
  });

  return updatedCategory;
};

export const removeCategory = async (
  restaurantId: string,
  id: string,
  currentEmployeeId: string,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.CATEGORY_DELETED,

    entity: AuditEntity.Category,
    entityId: category.id,

    metadata: {
      name: category.name,
    },
  });
};