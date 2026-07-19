import { z } from "zod";

const employeeRoleEnum = z.enum([
  "MANAGER",
  "STAFF",
]);

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100),

    email: z
      .string()
      .trim()
      .email()
      .toLowerCase(),

    password: z
      .string()
      .min(8)
      .max(100),

    role: employeeRoleEnum,
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    role: employeeRoleEnum.optional(),
  }),
});

export const updateEmployeeStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const employeeIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});