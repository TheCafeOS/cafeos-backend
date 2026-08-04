import { NotificationType } from "@prisma/client";
import { z } from "zod";

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    isRead: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        return value === "true";
      }),

    type: z.nativeEnum(NotificationType).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});