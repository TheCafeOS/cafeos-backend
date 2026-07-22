import {
  AuditAction,
  Prisma,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { getPaginationMeta } from "../utils/pagination.js";

export interface AuditLogInput {
  restaurantId: string;
  employeeId?: string | null;

  action: AuditAction;

  entity: string;
  entityId?: string |null;

  metadata?: Prisma.InputJsonValue;
}

export const auditService = {
  async log(data: AuditLogInput) {
    return prisma.auditLog.create({
      data,
    });
  },

  async listLogs(
    restaurantId: string,
    page: number,
    limit: number,
    search?: string,
    action?: AuditAction,
    entity?: string,
    employeeId?: string,
    from?: Date,
    to?: Date,
  ) {
    const skip = (page - 1) * limit;

    const normalizedSearch = search?.trim();

    const where: Prisma.AuditLogWhereInput = {
      restaurantId,

      ...(normalizedSearch && {
        OR: [
          {
            employee: {
              is: {
                name: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            employee: {
              is: {
                email: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      }),

      ...(action && {
        action,
      }),

      ...(entity && {
        entity,
      }),

      ...(employeeId && {
        employeeId,
      }),

      ...((from || to) && {
        createdAt: {
          ...(from && {
            gte: from,
          }),
          ...(to && {
            lte: to,
          }),
        },
      }),
    };

    const [logs, totalItems] =
      await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

    return {
      data: logs,
      pagination: getPaginationMeta(
        page,
        limit,
        totalItems,
      ),
    };
  }
};

