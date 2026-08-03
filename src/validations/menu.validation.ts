import { FoodType } from "@prisma/client";
import { z } from "zod";

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Menu item name is required").max(100),
    description: z.string().max(500).optional(),
    price: z.number().positive("Price must be greater than 0"),
    categoryId: z.string().optional(),
    isAvailable: z.boolean().optional(),
    foodType: z.nativeEnum(FoodType).optional(),

    imageScale: z.number().min(0.5).max(5).optional(),
    imagePositionX: z.number().min(-1000).max(1000).optional(),
    imagePositionY: z.number().min(-1000).max(1000).optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),

  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().positive().optional(),
    categoryId: z.string().optional(),
    isAvailable: z.boolean().optional(),
    foodType: z.nativeEnum(FoodType).optional(),

    imageScale: z.number().min(0.5).max(5).optional(),
    imagePositionX: z.number().min(-1000).max(1000).optional(),
    imagePositionY: z.number().min(-1000).max(1000).optional(),
  }),
});

export const uploadMenuImageSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteMenuItemSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});