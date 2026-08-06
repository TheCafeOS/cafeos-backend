import { z } from "zod";

export const publicMenuSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
  }),
});

export const publicOrderSchema = z.object({
  params: z.object({
    orderId: z.string().cuid(),
  }),
});

export const publicLoyaltyProgramSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
  }),
});

export const publicCustomerLoyaltySchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),

    phone: z
      .string()
      .trim()
      .min(5)
      .max(20),
  }),
});

export const publicOrderDetailsSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
    orderId: z.string().cuid(),
  }),
});