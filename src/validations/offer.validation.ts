import { z } from "zod";

const offerBody = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),

  discountType: z.enum([
    "PERCENTAGE",
    "FIXED",
  ]),

  discountValue: z
    .number()
    .positive(),

  minimumOrderValue: z
    .number()
    .nonnegative(),

  maximumDiscount: z
    .number()
    .positive()
    .optional()
    .nullable(),

  isActive: z.boolean(),

  startsAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),

  endsAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
});

export const offerSchema = z.object({
  body: offerBody,
});

export const offerIdSchema = z.object({
  params: z.object({
    offerId: z.string().cuid(),
  }),
});

export const offerStatusSchema = z.object({
  params: z.object({
    offerId: z.string().cuid(),
  }),

  body: z.object({
    isActive: z.boolean(),
  }),
});