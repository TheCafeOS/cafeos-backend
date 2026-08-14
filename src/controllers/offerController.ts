import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.js";
import { offerService } from "../services/offer.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const createOffer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offer =
    await offerService.createOffer(
      req.employee!.restaurantId,
      req.employee!.id,
      {
        ...req.body,
        startsAt: req.body.startsAt
          ? new Date(req.body.startsAt)
          : null,
        endsAt: req.body.endsAt
          ? new Date(req.body.endsAt)
          : null,
      },
    );

  return res.status(201).json(
    successResponse(
      "Offer created successfully",
      offer,
    ),
  );
};

export const listOffers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offers =
    await offerService.listOffers(
      req.employee!.restaurantId,
    );

  return res.json(
    successResponse(
      "Offers fetched successfully",
      offers,
    ),
  );
};

export const getOffer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offerId =
    getRouteParam(req.params.offerId);

  const offer =
    await offerService.getOffer(
      req.employee!.restaurantId,
      offerId,
    );

  return res.json(
    successResponse(
      "Offer fetched successfully",
      offer,
    ),
  );
};

export const updateOffer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offerId =
    getRouteParam(req.params.offerId);

  const offer =
    await offerService.updateOffer(
      req.employee!.restaurantId,
      req.employee!.id,
      offerId,
      {
        ...req.body,
        startsAt: req.body.startsAt
          ? new Date(req.body.startsAt)
          : null,
        endsAt: req.body.endsAt
          ? new Date(req.body.endsAt)
          : null,
      },
    );

  return res.json(
    successResponse(
      "Offer updated successfully",
      offer,
    ),
  );
};

export const updateOfferStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offerId =
    getRouteParam(req.params.offerId);

  const offer =
    await offerService.updateOfferStatus(
      req.employee!.restaurantId,
      req.employee!.id,
      offerId,
      req.body.isActive,
    );

  return res.json(
    successResponse(
      "Offer status updated successfully",
      offer,
    ),
  );
};

export const deleteOffer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const offerId =
    getRouteParam(req.params.offerId);

  await offerService.deleteOffer(
    req.employee!.restaurantId,
    req.employee!.id,
    offerId,
  );

  return res.json(
    successResponse(
      "Offer deleted successfully",
      null,
    ),
  );
};