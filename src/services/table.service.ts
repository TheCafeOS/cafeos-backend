import {
  AuditAction,
  TableStatus,
} from "@prisma/client";
import QRCode from "qrcode";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";

async function getTableOrThrow(
  restaurantId: string,
  tableId: string,
) {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      restaurantId,
    },
  });

  if (!table) {
    throw new AppError("Table not found.", 404);
  }

  return table;
}

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
  const trimmedName = name.trim();

  const existingTable = await prisma.restaurantTable.findFirst({
    where: {
      restaurantId,
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (existingTable) {
    throw new AppError(
      "Table already exists.",
      409,
    );
  }

  const table = await prisma.restaurantTable.create({
    data: {
      restaurantId,
      name: trimmedName,
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
  await getTableOrThrow(
    restaurantId,
    id,
  );

  if (data.name) {
    const trimmedName = data.name.trim();

    const existingTable = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId,
        NOT: {
          id,
        },
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existingTable) {
      throw new AppError(
        "Table already exists.",
        409,
      );
    }

    data.name = trimmedName;
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
  const table = await getTableOrThrow(
    restaurantId,
    id,
  );

  try {
    await prisma.restaurantTable.delete({
      where: {
        id,
      },
    });
  } catch {
    throw new AppError(
      "This table cannot be deleted because it has existing orders.",
      409,
    );
  }

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
  const table = await getTableOrThrow(
    restaurantId,
    tableId,
  );

  return QRCode.toBuffer(table.qrCode, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
}