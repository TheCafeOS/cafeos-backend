import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validations/settings.validation.js";
import { uploadImage } from "../middleware/upload.js";
import {
  getSettings,
  updateSettings,
  uploadRestaurantLogo,
  uploadRestaurantCover,
} from "../controllers/settings.controller.js";

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

router.patch(
  "/logo",
  requireAuth,
  uploadImage.single("image"),
  asyncHandler(uploadRestaurantLogo),
);

router.patch(
  "/cover",
  requireAuth,
  uploadImage.single("image"),
  asyncHandler(uploadRestaurantCover),
);

export default router;