import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(register),
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(login),
);

export default router;