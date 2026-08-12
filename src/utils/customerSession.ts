import { randomUUID } from "crypto";
import { Request, Response } from "express";

const CUSTOMER_SESSION_COOKIE =
  "cafeos_customer_session";

const CUSTOMER_SESSION_MAX_AGE =
  30 * 24 * 60 * 60 * 1000; // 30 days

const getCookieValue = (
  req: Request,
  name: string,
): string | null => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        valueParts.join("="),
      );
    }
  }

  return null;
};

export const getOrCreateCustomerSessionId = (
  req: Request,
  res: Response,
): string => {
  const existingSessionId =
    getCookieValue(
      req,
      CUSTOMER_SESSION_COOKIE,
    );

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = randomUUID();

  const isProduction =
    process.env.NODE_ENV === "production";

  res.cookie(
    CUSTOMER_SESSION_COOKIE,
    sessionId,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction
        ? "none"
        : "lax",
      maxAge: CUSTOMER_SESSION_MAX_AGE,
      path: "/",
    },
  );

  return sessionId;
};