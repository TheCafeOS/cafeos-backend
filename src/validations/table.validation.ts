import { z } from "zod";

export const createTableSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Table name is required")
      .max(50, "Table name is too long"),
  }),
});
export const updateTableSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),

  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    status: z
  .enum([
    "AVAILABLE",
    "OCCUPIED",
    "RESERVED",
    "INACTIVE",
  ])
  .optional(),
  }),
});

export const deleteTableSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const downloadQrSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const mergeTablesSchema = z.object({
  body: z.object({
    tableIds: z
      .array(z.string().cuid())
      .min(
        2,
        "At least 2 tables are required",
      )
      .max(
        50,
        "A maximum of 50 tables can be merged at once",
      ),
  }),
});

export const tableMergeIdSchema = z.object({
  params: z.object({
    mergeId: z.string().cuid(),
  }),
});