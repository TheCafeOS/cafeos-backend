import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(50),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(50),
  }),
});