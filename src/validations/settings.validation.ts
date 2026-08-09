import { z } from "zod";

const nullableTrimmed = z.string().trim().optional().nullable();

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be in HH:mm format",
  );

const openingHourDaySchema = z
  .object({
    isOpen: z.boolean(),
    open: timeSchema.nullable(),
    close: timeSchema.nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.isOpen && day.open === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["open"],
        message:
          "Opening time is required when the restaurant is open",
      });
    }

    if (day.isOpen && day.close === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["close"],
        message:
          "Closing time is required when the restaurant is open",
      });
    }
  });

export const openingHoursSchema = z.object({
  monday: openingHourDaySchema,
  tuesday: openingHourDaySchema,
  wednesday: openingHourDaySchema,
  thursday: openingHourDaySchema,
  friday: openingHourDaySchema,
  saturday: openingHourDaySchema,
  sunday: openingHourDaySchema,
});

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

    openingHours: openingHoursSchema.optional().nullable(),
  }),
});