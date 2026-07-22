import {
  AuditAction,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";
import {
  getPaginationMeta,
  getPaginationParams,
} from "../utils/pagination.js";

async function getCategoryOrThrow(
  restaurantId: string,
  categoryId: string,
) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      restaurantId,
    },
  });

  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  return category;
}

export const getCategories = async (
  restaurantId: string,
  page?: string,
  limit?: string,
  search?: string,
  sort?: "name" | "createdAt",
  order?: "asc" | "desc",
) => {
  const pagination = getPaginationParams(page, limit);

  const where: Prisma.CategoryWhereInput = {
    restaurantId,

    ...(search?.trim() && {
      name: {
        contains: search.trim(),
        mode: "insensitive",
      },
    }),
  };

  const orderBy: Prisma.CategoryOrderByWithRelationInput = {
    [sort ?? "createdAt"]: order ?? "asc",
  };

  const [categories, totalItems] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy,
    }),

    prisma.category.count({
      where,
    }),
  ]);

  return {
    data: categories,
    pagination: getPaginationMeta(
      pagination.page,
      pagination.limit,
      totalItems,
    ),
  };
};

export const addCategory = async (
  restaurantId: string,
  currentEmployeeId: string,
  name: string,
) => {
  const trimmedName = name.trim();

  const existingCategory = await prisma.category.findFirst({
    where: {
      restaurantId,
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    throw new AppError("Category already exists.", 409);
  }

  const category = await prisma.category.create({
    data: {
      restaurantId,
      name: trimmedName,
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
  const trimmedName = name.trim();

  const category = await getCategoryOrThrow(
    restaurantId,
    id,
  );

  const existingCategory = await prisma.category.findFirst({
    where: {
      restaurantId,
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
      NOT: {
        id,
      },
    },
  });

  if (existingCategory) {
    throw new AppError("Category already exists.", 409);
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id,
    },
    data: {
      name: trimmedName,
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
  const category = await getCategoryOrThrow(
    restaurantId,
    id,
  );

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