import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface TokenPayload {
  sub: string;
  restaurantId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
}

export const generateAccessToken = (
  sub: string,
  restaurantId: string,
  role: "OWNER" | "MANAGER" | "STAFF",
): string =>
  jwt.sign(
    {
      sub,
      restaurantId,
      role,
    },
    env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

export const generateRefreshToken = (
  sub: string,
  restaurantId: string,
  role: "OWNER" | "MANAGER" | "STAFF",
): string =>
  jwt.sign(
    {
      sub,
      restaurantId,
      role,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );

export const verifyAccessToken = (
  token: string,
): TokenPayload =>
  jwt.verify(
    token,
    env.JWT_SECRET,
  ) as TokenPayload;

export const verifyRefreshToken = (
  token: string,
): TokenPayload =>
  jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
  ) as TokenPayload;