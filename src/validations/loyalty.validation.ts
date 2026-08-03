import { z } from "zod";

export const loyaltyProgramSchema = z.object({
  body: z.object({
    rewardName: z.string().trim().min(1).max(80),
    purchaseThreshold: z.number().int().positive(),
    rewardQuantity: z.number().int().positive(),
    minimumOrderValue: z.number().nonnegative(),
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
