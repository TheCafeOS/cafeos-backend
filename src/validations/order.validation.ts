import { z } from "zod";
import { ORDER_STATUS } from "../utils/orderStatus.js";

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().min(1, "Table ID is required"),

    customerPhone: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .optional(),

    items: z
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
      .min(1, "At least one item is required"),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),

  body: z.object({
    status: z.enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ]),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listOrdersSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),

      limit: z.coerce.number().int().min(1).max(100).optional(),

      status: z
        .enum([
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY,
          ORDER_STATUS.COMPLETED,
          ORDER_STATUS.CANCELLED,
        ])
        .optional(),
      
       search: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),  

      tableId: z.string().optional(),

      from: z.coerce.date().optional(),

      to: z.coerce.date().optional(),

      sort: z
        .enum([
          "createdAt",
          "status",
          "total",
        ])
        .optional(),

      order: z
        .enum([
          "asc",
          "desc",
        ])
        .optional(),
    })
    .refine(
      (query) =>
        !query.from ||
        !query.to ||
        query.from <= query.to,
      {
        message: "Invalid date range.",
        path: ["from"],
      },
    ),
});