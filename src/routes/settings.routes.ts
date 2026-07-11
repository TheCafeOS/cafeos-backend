import { Router } from "express";

import { getSettings } from "../controllers/settings.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(getSettings),
);

export default router;