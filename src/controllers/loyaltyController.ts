import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { loyaltyService } from "../services/loyalty.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const upsertProgram = async (req: AuthenticatedRequest, res: Response) => {
  const program = await loyaltyService.upsertProgram(req.employee!.restaurantId, req.body);
  return res.json(successResponse("Loyalty program updated successfully", program));
};

export const getProgram = async (req: AuthenticatedRequest, res: Response) => {
  const program = await loyaltyService.getProgram(req.employee!.restaurantId);
  return res.json(successResponse("Loyalty program fetched successfully", program));
};

export const getCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const phone = getRouteParam(req.params.phone);
  const result = await loyaltyService.getCustomer(req.employee!.restaurantId, phone);
  return res.json(successResponse("Customer loyalty profile fetched successfully", result));
};

export const redeemReward = async (req: AuthenticatedRequest, res: Response) => {
  const rewardId = getRouteParam(req.params.rewardId);
  const customerId = getRouteParam(req.params.customerId);
  const reward = await loyaltyService.redeemReward(req.employee!.restaurantId, customerId, rewardId);
  return res.json(successResponse("Reward redeemed successfully", reward));
};
