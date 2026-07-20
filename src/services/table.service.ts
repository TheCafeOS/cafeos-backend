import {
  AuditAction,
  TableStatus,
} from "@prisma/client";
import QRCode from "qrcode";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";

export const getTables = async (restaurantId: string) => {
  return prisma.restaurantTable.findMany({
    where: {
      restaurantId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const addTable = async (
  restaurantId: string,
  currentEmployeeId: string,
  name: string,
) => {
  const table = await prisma.restaurantTable.create({
    data: {
      restaurantId,
      name,
      qrCode: crypto.randomUUID(),
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.TABLE_CREATED,

    entity: AuditEntity.Table,
    entityId: table.id,

    metadata: {
      name: table.name,
      status: table.status,
    },
  });

  return table;
};

export const editTable = async (
  restaurantId: string,
  currentEmployeeId: string,
  id: string,
  data: {
    name?: string;
    status?: TableStatus;
  },
) => {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!table) {
    throw new AppError("Table not found", 404);
  }

  const updatedTable = await prisma.restaurantTable.update({
    where: {
      id,
    },
    data,
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.TABLE_UPDATED,

    entity: AuditEntity.Table,
    entityId: updatedTable.id,

    metadata: {
      name: updatedTable.name,
      status: updatedTable.status,
    },
  });

  return updatedTable;
};

export const removeTable = async (
  restaurantId: string,
  currentEmployeeId: string,
  id: string,
) => {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!table) {
    throw new AppError("Table not found", 404);
  }

  await prisma.restaurantTable.delete({
    where: {
      id,
    },
  });

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,

    action: AuditAction.TABLE_DELETED,

    entity: AuditEntity.Table,
    entityId: table.id,

    metadata: {
      name: table.name,
      status: table.status,
    },
  });
};

export async function generateTableQr(
  restaurantId: string,
  tableId: string,
): Promise<Buffer> {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      restaurantId,
    },
    select: {
      qrCode: true,
    },
  });

  if (!table) {
    throw new AppError("Table not found", 404);
  }

  return QRCode.toBuffer(table.qrCode, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
}