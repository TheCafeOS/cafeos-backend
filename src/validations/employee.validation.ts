import { z } from "zod";

const employeeRoleEnum = z.enum([
  "MANAGER",
  "STAFF",
]);

export const createEmployeeRequest = z.object({
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
      .min(12)
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      ),

    role: employeeRoleEnum,
  }),
});

export const getEmployeeRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateEmployeeRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),

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

export const updateEmployeeStatusRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),

  body: z.object({
    isActive: z.boolean(),
  }),
});

export const deleteEmployeeRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});