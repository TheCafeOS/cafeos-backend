import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

interface TokenPayload {
  sub: string;
}

export const generateAccessToken = (
  employeeId: string,
): string => {
  return jwt.sign(
    { sub: employeeId },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

export const verifyAccessToken = (
  token: string,
): TokenPayload => {
  return jwt.verify(
    token,
    env.JWT_SECRET,
  ) as TokenPayload;
};