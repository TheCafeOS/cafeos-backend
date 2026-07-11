import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    restaurantEmail: z.string().email(),
    phone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
  }),
});