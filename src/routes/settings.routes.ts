import { Router } from "express";

import { getSettings } from "../controllers/settings.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateSettings } from "../controllers/settings.controller.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validations/settings.validation.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(getSettings),
);

router.patch(
  "/",
  requireAuth,
  validate(updateSettingsSchema),
  asyncHandler(updateSettings),
);

export default router;