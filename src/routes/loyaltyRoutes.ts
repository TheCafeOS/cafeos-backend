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
  createProgram,
  listPrograms,
  getProgram,
  updateProgram,
  updateProgramStatus,
  deleteProgram,
  getCustomer,
  redeemReward,
  listCustomers,
} from "../controllers/loyaltyController.js";

import {
  loyaltyProgramSchema,
  loyaltyProgramIdSchema,
  loyaltyProgramStatusSchema,
  loyaltyCustomerSchema,
  loyaltyRedeemSchema,
  listLoyaltyCustomersSchema,
} from "../validations/loyalty.validation.js";

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

// Program CRUD

router.get(
  "/programs",
  requireAuth,
  requireRole(...staffRoles),
  asyncHandler(listPrograms),
);

router.post(
  "/programs",
  requireAuth,
  requireRole(...managementRoles),
  validate(loyaltyProgramSchema),
  asyncHandler(createProgram),
);

router.get(
  "/programs/:programId",
  requireAuth,
  requireRole(...staffRoles),
  validate(loyaltyProgramIdSchema),
  asyncHandler(getProgram),
);

router.patch(
  "/programs/:programId",
  requireAuth,
  requireRole(...managementRoles),
  validate(loyaltyProgramSchema),
  asyncHandler(updateProgram),
);

router.patch(
  "/programs/:programId/status",
  requireAuth,
  requireRole(...managementRoles),
  validate(
    loyaltyProgramStatusSchema,
  ),
  asyncHandler(updateProgramStatus),
);

router.delete(
  "/programs/:programId",
  requireAuth,
  requireRole(...managementRoles),
  validate(loyaltyProgramIdSchema),
  asyncHandler(deleteProgram),
);

// Existing customer endpoints

router.get(
  "/customers",
  requireAuth,
  requireRole(...staffRoles),
  validate(listLoyaltyCustomersSchema),
  asyncHandler(listCustomers),
);

router.get(
  "/customers/:phone",
  requireAuth,
  requireRole(...staffRoles),
  validate(loyaltyCustomerSchema),
  asyncHandler(getCustomer),
);

router.post(
  "/customers/:customerId/rewards/:rewardId/redeem",
  requireAuth,
  requireRole(...staffRoles),
  validate(loyaltyRedeemSchema),
  asyncHandler(redeemReward),
);

export default router;