import { Router } from "express";

import {
  getPublicMenu,
  createPublicOrder,
  getPublicOrder,
} from "../controllers/publicController.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/menu/:qrToken",
  asyncHandler(getPublicMenu),
);

router.post(
  "/orders/:qrToken",
  asyncHandler(createPublicOrder),
);

router.get(
  "/orders/:qrToken/:orderId",
  asyncHandler(getPublicOrder),
);

export default router;