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