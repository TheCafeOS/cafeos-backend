import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  asyncHandler(register),
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(login),
);

export default router;