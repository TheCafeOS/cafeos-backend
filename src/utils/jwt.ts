import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  sub: string;
}

export const generateAccessToken = (
  employeeId: string,
): string =>
  jwt.sign(
    { sub: employeeId },
    env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

export const generateRefreshToken = (
  employeeId: string,
): string =>
  jwt.sign(
    { sub: employeeId },
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