import { TableStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import QRCode from "qrcode";
import { AppError } from "../utils/AppError.js";

export const getTables = async (restaurantId: string) => {
  return prisma.restaurantTable.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });
};

export const addTable = async (
  restaurantId: string,
  name: string,
) => {
  return prisma.restaurantTable.create({
    data: {
      restaurantId,
      name,
      qrCode: crypto.randomUUID(),
    },
  });
};

export const editTable = async (
  restaurantId: string,
  id: string,
  data: {
    name?: string;
    status?: TableStatus;
  },
) => {
  const updated = await prisma.restaurantTable.updateMany({
    where: {
      id,
      restaurantId,
    },
    data,
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.restaurantTable.findUnique({
    where: { id },
  });
};

export const removeTable = async (
  restaurantId: string,
  id: string,
) => {
  const deleted = await prisma.restaurantTable.deleteMany({
    where: {
      id,
      restaurantId,
    },
  });

  return deleted.count > 0;
};

export async function generateTableQr(
  restaurantId: string,
  tableId: string
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