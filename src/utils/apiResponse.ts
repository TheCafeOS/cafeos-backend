import type { PaginationMeta } from "./pagination.js";

export const successResponse = <T>(
  message: string,
  data?: T,
  pagination?: PaginationMeta,
) => ({
  success: true,
  message,
  data,
  ...(pagination && { pagination }),
});

export const errorResponse = (
  message: string,
) => ({
  success: false,
  message,
});