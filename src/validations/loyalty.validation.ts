import { z } from "zod";

const loyaltyProgramBody = z.object({
  rewardName: z.string().trim().min(1).max(80),
  purchaseThreshold: z.number().int().positive(),
  rewardQuantity: z.number().int().positive(),
  minimumOrderValue: z.number().nonnegative(),
  isActive: z.boolean(),
});

export const loyaltyProgramSchema = z.object({
  body: loyaltyProgramBody,
});

export const loyaltyProgramIdSchema = z.object({
  params: z.object({
    programId: z.string().cuid(),
  }),
});

export const loyaltyProgramStatusSchema =
  z.object({
    params: z.object({
      programId: z.string().cuid(),
    }),
    body: z.object({
      isActive: z.boolean(),
    }),
  });

export const loyaltyCustomerSchema = z.object({
  params: z.object({
    phone: z.string().trim().min(1).max(20),
  }),
});

export const loyaltyRedeemSchema = z.object({
  params: z.object({
    customerId: z.string().cuid(),
    rewardId: z.string().cuid(),
  }),
});

export const listLoyaltyCustomersSchema =
  z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),

      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional(),

      search: z.string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

      sort: z
        .enum([
          "lastOrderAt",
          "visitCount",
          "totalSpend",
          "createdAt",
        ])
        .optional(),

      order: z
        .enum(["asc", "desc"])
        .optional(),
    }),
  });