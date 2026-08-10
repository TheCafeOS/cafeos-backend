import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { loyaltyService } from "../services/loyalty.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const createProgram = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const program =
    await loyaltyService.createProgram(
      req.employee!.restaurantId,
      req.body,
    );

  return res.status(201).json(
    successResponse(
      "Loyalty program created successfully",
      program,
    ),
  );
};

export const listPrograms = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const programs =
    await loyaltyService.listPrograms(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Loyalty programs fetched successfully",
      programs,
    ),
  );
};

export const getProgram = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const programId =
    getRouteParam(req.params.programId);

  const program =
    await loyaltyService.getProgram(
      req.employee!.restaurantId,
      programId,
    );

  return res.json(
    successResponse(
      "Loyalty program fetched successfully",
      program,
    ),
  );
};

export const updateProgram = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const programId =
    getRouteParam(req.params.programId);

  const program =
    await loyaltyService.updateProgram(
      req.employee!.restaurantId,
      programId,
      req.body,
    );

  return res.json(
    successResponse(
      "Loyalty program updated successfully",
      program,
    ),
  );
};

export const updateProgramStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const programId =
    getRouteParam(req.params.programId);

  const program =
    await loyaltyService.updateProgramStatus(
      req.employee!.restaurantId,
      programId,
      req.body.isActive,
    );

  return res.json(
    successResponse(
      "Loyalty program status updated successfully",
      program,
    ),
  );
};

export const deleteProgram = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const programId =
    getRouteParam(req.params.programId);

  await loyaltyService.deleteProgram(
    req.employee!.restaurantId,
    programId,
  );

  return res.json(
    successResponse(
      "Loyalty program deleted successfully",
      null,
    ),
  );
};

export const getCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const phone = getRouteParam(
    req.params.phone,
  );

  const result =
    await loyaltyService.getCustomer(
      req.employee!.restaurantId,
      phone,
    );

  return res.json(
    successResponse(
      "Customer loyalty profile fetched successfully",
      result,
    ),
  );
};

export const redeemReward = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const rewardId = getRouteParam(
    req.params.rewardId,
  );

  const customerId = getRouteParam(
    req.params.customerId,
  );

  const reward =
    await loyaltyService.redeemReward(
      req.employee!.restaurantId,
      customerId,
      rewardId,
    );

  return res.json(
    successResponse(
      "Reward redeemed successfully",
      reward,
    ),
  );
};

export const listCustomers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result =
    await loyaltyService.listCustomers(
      req.employee!.restaurantId,
      req.query.page as string | undefined,
      req.query.limit as string | undefined,
      req.query.search as string | undefined,
      req.query.sort as
        | "lastOrderAt"
        | "visitCount"
        | "totalSpend"
        | "createdAt"
        | undefined,
      req.query.order as
        | "asc"
        | "desc"
        | undefined,
    );

  return res.json(
    successResponse(
      "Loyalty customers fetched successfully",
      result.data,
      result.pagination,
    ),
  );
};