import {
  AuditAction,
  OrderStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { auditService } from "./audit.service.js";
import { AuditEntity } from "../constants/audit.js";

import {
  broadcastTableMergeEvent,
} from "../lib/socket.js";

import {
  SocketEvents,
} from "../constants/socketEvents.js";

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
];

const BILLABLE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "COMPLETED",
];

const tableMergeInclude = {
  tables: {
    include: {
      table: true,
    },
  },
  orders: {
    include: {
      table: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

const normalizeTableIds = (tableIds: string[]) => {
  return [...new Set(tableIds)];
};

async function getMergeOrThrow(
  restaurantId: string,
  mergeId: string,
) {
  const merge = await prisma.tableMerge.findFirst({
    where: {
      id: mergeId,
      restaurantId,
    },
    include: tableMergeInclude,
  });

  if (!merge) {
    throw new AppError(
      "Table merge not found.",
      404,
    );
  }

  return merge;
}

export async function listTableMerges(
  restaurantId: string,
  activeOnly = true,
) {
  const merges = await prisma.tableMerge.findMany({
    where: {
      restaurantId,
      ...(activeOnly
        ? {
            isActive: true,
          }
        : {}),
    },
    include: tableMergeInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return merges.map((merge) =>
    mapTableMergeResponse(merge),
  );
}

export async function getTableMerge(
  restaurantId: string,
  mergeId: string,
) {
  const merge = await getMergeOrThrow(
    restaurantId,
    mergeId,
  );

  return mapTableMergeResponse(merge);
}

export async function mergeTables(
  restaurantId: string,
  currentEmployeeId: string,
  tableIds: string[],
) {
  const normalizedTableIds =
    normalizeTableIds(tableIds);

  if (normalizedTableIds.length < 2) {
    throw new AppError(
      "At least 2 tables are required to create a merge.",
      400,
    );
  }

  const merge = await prisma.$transaction(
    async (tx) => {
      /*
       * Lock all selected table rows in a deterministic order.
       * This prevents concurrent merge requests from assigning
       * the same table to multiple active merges.
       */
      const sortedTableIds =
        [...normalizedTableIds].sort();

      await tx.$queryRaw`
        SELECT "id"
        FROM "RestaurantTable"
        WHERE "restaurantId" = ${restaurantId}
            AND "id" IN (${Prisma.join(sortedTableIds)})
        ORDER BY "id"
        FOR UPDATE
        `;

      const tables =
        await tx.restaurantTable.findMany({
          where: {
            restaurantId,
            id: {
              in: normalizedTableIds,
            },
          },
          orderBy: {
            id: "asc",
          },
        });

      if (
        tables.length !==
        normalizedTableIds.length
      ) {
        throw new AppError(
          "One or more tables were not found.",
          404,
        );
      }

      const inactiveTable =
        tables.find(
          (table) =>
            table.status === "INACTIVE",
        );

      if (inactiveTable) {
        throw new AppError(
          `Table ${inactiveTable.name} is inactive and cannot be merged.`,
          409,
        );
      }

      const existingActiveMembership =
        await tx.tableMergeTable.findFirst({
          where: {
            restaurantId,
            tableId: {
              in: normalizedTableIds,
            },
            merge: {
              isActive: true,
            },
          },
          include: {
            table: true,
            merge: true,
          },
        });

      if (existingActiveMembership) {
        throw new AppError(
          `Table ${existingActiveMembership.table.name} is already part of an active table merge.`,
          409,
        );
      }

      const createdMerge =
        await tx.tableMerge.create({
          data: {
            restaurantId,
            isActive: true,
            tables: {
              create: normalizedTableIds.map(
                (tableId) => ({
                  restaurantId,
                  tableId,
                }),
              ),
            },
          },
        });

      /*
       * Existing orders are intentionally attached to the merge.
       *
       * This is what allows management to merge tables AFTER
       * customers have already ordered separately.
       *
       * CANCELLED orders are excluded because they should never
       * contribute to a future combined bill.
       */
      await tx.order.updateMany({
        where: {
          restaurantId,
          tableId: {
            in: normalizedTableIds,
          },
          status: {
            in: BILLABLE_ORDER_STATUSES,
          },
          tableMergeId: null,
        },
        data: {
          tableMergeId: createdMerge.id,
        },
      });

      return tx.tableMerge.findUniqueOrThrow({
        where: {
          id: createdMerge.id,
        },
        include: tableMergeInclude,
      });
    },
  );

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,
    action: AuditAction.TABLES_MERGED,
    entity: AuditEntity.Table,
    entityId: merge.id,
    metadata: {
      mergeId: merge.id,
      tableIds: normalizedTableIds,
      tableNames: merge.tables.map(
        (entry) => entry.table.name,
      ),
      orderIds: merge.orders.map(
        (order) => order.id,
      ),
    },
  });

  broadcastTableMergeEvent(
    restaurantId,
    SocketEvents.TABLES_MERGED,
    {
        mergeId: merge.id,
        tableIds: merge.tables.map(
        (entry) => entry.table.id,
        ),
        tableNames: merge.tables.map(
        (entry) => entry.table.name,
        ),
    },
    );

  return mapTableMergeResponse(merge);
}

export async function unmergeTables(
  restaurantId: string,
  currentEmployeeId: string,
  mergeId: string,
) {
  const merge = await prisma.$transaction(
    async (tx) => {
      const existing =
        await tx.tableMerge.findFirst({
          where: {
            id: mergeId,
            restaurantId,
          },
          include: {
            tables: {
              include: {
                table: true,
              },
            },
          },
        });

      if (!existing) {
        throw new AppError(
          "Table merge not found.",
          404,
        );
      }

      if (!existing.isActive) {
        throw new AppError(
          "This table merge is already inactive.",
          409,
        );
      }

      /*
       * Lock the participating tables before
       * changing the merge state.
       */
      const sortedTableIds =
        existing.tables
          .map((entry) => entry.tableId)
          .sort();

      if (sortedTableIds.length > 0) {
        await tx.$queryRaw`
            SELECT "id"
            FROM "RestaurantTable"
            WHERE "restaurantId" = ${restaurantId}
                AND "id" IN (${Prisma.join(sortedTableIds)})
            ORDER BY "id"
            FOR UPDATE
        `;
      }

      /*
       * The current CafeOS payment model does not yet have a
       * payment/settlement entity.
       *
       * Therefore, unmerge detaches the orders from the group.
       * The original tableId remains untouched.
       */
      await tx.order.updateMany({
        where: {
          restaurantId,
          tableMergeId: mergeId,
        },
        data: {
          tableMergeId: null,
        },
      });

      const updatedMerge =
        await tx.tableMerge.update({
          where: {
            id: mergeId,
          },
          data: {
            isActive: false,
          },
          include: tableMergeInclude,
        });

      return updatedMerge;
    },
  );

  await auditService.log({
    restaurantId,
    employeeId: currentEmployeeId,
    action: AuditAction.TABLES_UNMERGED,
    entity: AuditEntity.Table,
    entityId: merge.id,
    metadata: {
      mergeId: merge.id,
      tableIds: merge.tables.map(
        (entry) => entry.tableId,
      ),
      tableNames: merge.tables.map(
        (entry) => entry.table.name,
      ),
    },
  });

  broadcastTableMergeEvent(
    restaurantId,
    SocketEvents.TABLES_UNMERGED,
    {
        mergeId: merge.id,
        tableIds: merge.tables.map(
        (entry) => entry.table.id,
        ),
        tableNames: merge.tables.map(
        (entry) => entry.table.name,
        ),
    },
    );

  return mapTableMergeResponse(merge);
}

function mapTableMergeResponse(
  merge: any,
) {
  const orders = merge.orders ?? [];

  const total = orders.reduce(
    (sum: number, order: any) =>
      sum + Number(order.total),
    0,
  );

  const activeOrderCount =
    orders.filter((order: any) =>
      ACTIVE_ORDER_STATUSES.includes(
        order.status,
      ),
    ).length;

  return {
    id: merge.id,
    isActive: merge.isActive,
    createdAt: merge.createdAt,
    updatedAt: merge.updatedAt,

    tables: merge.tables.map(
      (entry: any) => ({
        id: entry.table.id,
        name: entry.table.name,
        status: entry.table.status,
      }),
    ),

    orders: orders.map(
      (order: any) => ({
        id: order.id,
        table: order.table,
        status: order.status,
        total: Number(order.total),
        customerPhone:
          order.customerPhone,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items?.map(
          (item: any) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            menuItem: item.menuItem,
          }),
        ),
      }),
    ),

    orderCount: orders.length,
    activeOrderCount,
    total,
  };
}