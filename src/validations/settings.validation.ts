import { z } from "zod";

const nullableTrimmed = z.string().trim().optional().nullable();

export const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),

    restaurantEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email(),

    phone: nullableTrimmed,

    address: nullableTrimmed,

    tagline: z
      .string()
      .trim()
      .max(120)
      .optional()
      .nullable(),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable(),

    cuisineType: z
      .string()
      .trim()
      .max(100)
      .optional()
      .nullable(),

    website: z.string().url().optional().nullable(),

    instagram: z.string().url().optional().nullable(),

    facebook: z.string().url().optional().nullable(),

    customLink: z.string().url().optional().nullable(),

    themeColor: z
      .string()
      .regex(/^#([0-9A-Fa-f]{6})$/, "Invalid HEX color")
      .optional()
      .nullable(),
  }),
});