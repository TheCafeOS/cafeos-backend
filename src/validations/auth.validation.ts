import { z } from "zod";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
  );

export const registerSchema = z.object({
  body: z.object({
    restaurantName: z
      .string()
      .trim()
      .min(1, "Restaurant name is required."),

    restaurantEmail: z
      .string()
      .trim()
      .email("Invalid restaurant email address."),

    restaurantPhone: z
      .string()
      .trim()
      .min(1, "Restaurant phone is required."),

    address: z
      .string()
      .trim()
      .min(1, "Restaurant address is required."),

    ownerName: z
      .string()
      .trim()
      .min(1, "Owner name is required."),

    ownerEmail: z
      .string()
      .trim()
      .email("Invalid owner email address."),

    password: passwordSchema,
  }),

  params: z.object({}),

  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address."),

    password: z
      .string()
      .min(1, "Password is required."),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
});