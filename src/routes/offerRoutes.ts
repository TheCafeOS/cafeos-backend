import { Router } from "express";

import {
  requireAuth,
} from "../middleware/auth.js";

import {
  requireRole,
} from "../middleware/authorize.js";

import {
  asyncHandler,
} from "../utils/asyncHandler.js";

import {
  validate,
} from "../middleware/validate.js";

import {
  createOffer,
  listOffers,
  getOffer,
  updateOffer,
  updateOfferStatus,
  deleteOffer,
} from "../controllers/offerController.js";

import {
  offerSchema,
  offerIdSchema,
  offerStatusSchema,
} from "../validations/offer.validation.js";

const router = Router();

const managementRoles = [
  "OWNER",
  "MANAGER",
] as const;

const staffRoles = [
  "OWNER",
  "MANAGER",
  "STAFF",
] as const;

router.get(
  "/",
  requireAuth,
  requireRole(...staffRoles),
  asyncHandler(listOffers),
);

router.post(
  "/",
  requireAuth,
  requireRole(...managementRoles),
  validate(offerSchema),
  asyncHandler(createOffer),
);

router.get(
  "/:offerId",
  requireAuth,
  requireRole(...staffRoles),
  validate(offerIdSchema),
  asyncHandler(getOffer),
);

router.patch(
  "/:offerId",
  requireAuth,
  requireRole(...managementRoles),
  validate(offerSchema),
  asyncHandler(updateOffer),
);

router.patch(
  "/:offerId/status",
  requireAuth,
  requireRole(...managementRoles),
  validate(offerStatusSchema),
  asyncHandler(updateOfferStatus),
);

router.delete(
  "/:offerId",
  requireAuth,
  requireRole(...managementRoles),
  validate(offerIdSchema),
  asyncHandler(deleteOffer),
);

export default router;