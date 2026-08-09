import { z } from "zod";

const orderItemsSchema = z
  .array(
    z.object({
      menuItemId: z
        .string()
        .min(1, "Menu item ID is required"),

      quantity: z
        .number()
        .int()
        .positive("Quantity must be greater than 0"),
    }),
  )
  .min(1, "At least one item is required");

const customerPhoneSchema = z
  .string()
  .trim()
  .min(5, "Invalid phone number")
  .max(20, "Invalid phone number");

export const publicMenuSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
  }),
});

export const publicOrderCreateSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
  }),

  body: z.object({
    customerPhone: customerPhoneSchema.optional().nullable(),

    items: orderItemsSchema,
  }),
});

export const publicOrderDetailsSchema = z.object({
  params: z.object({
    qrToken: z.string().trim().min(1),
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
    phone: customerPhoneSchema,
  }),
});