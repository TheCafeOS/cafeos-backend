import { z } from "zod";

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Menu item name is required").max(100),
    description: z.string().max(500).optional(),
    price: z.number().positive("Price must be greater than 0"),
    categoryId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().positive().optional(),
    categoryId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
  }),
});