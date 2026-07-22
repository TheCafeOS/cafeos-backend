import { AppError } from "./AppError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export function getPaginationParams(
  page?: string,
  limit?: string,
): PaginationParams {
  const parsedPage = page ? Number(page) : DEFAULT_PAGE;
  const parsedLimit = limit ? Number(limit) : DEFAULT_LIMIT;

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1
  ) {
    throw new AppError(
      "Page must be a positive integer.",
      400,
    );
  }

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > MAX_LIMIT
  ) {
    throw new AppError(
      `Limit must be between 1 and ${MAX_LIMIT}.`,
      400,
    );
  }

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
}

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function getPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}