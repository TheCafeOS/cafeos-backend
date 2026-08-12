import { Request, Response } from "express";

import * as publicService from "../services/public.service.js";
import * as orderService from "../services/order.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const getPublicMenu = async (
  req: Request,
  res: Response,
) => {
  const qrToken = getRouteParam(req.params.qrToken);

  const data = await publicService.getMenu(qrToken);

  return res.json(
    successResponse(
      "Menu fetched successfully",
      data,
    ),
  );
};

export const createPublicOrder = async (
  req: Request,
  res: Response,
) => {
  const qrToken = getRouteParam(req.params.qrToken);

  const order = await orderService.createPublicOrder(
    qrToken,
    req.ip,
    req.body.customerPhone ?? null,
    req.body.items,
  );

  return res.status(201).json(
    successResponse(
      "Order created successfully",
      {
        id: order.id,
        status: order.status,
        total: order.total,
        table: order.table?.name ?? null,
        createdAt: order.createdAt,
      },
    ),
  );
};

export const getPublicOrder = async (
  req: Request,
  res: Response,
) => {
  const qrToken = getRouteParam(req.params.qrToken);
  const orderId = getRouteParam(req.params.orderId);

  const data = await publicService.getOrder(
    qrToken,
    orderId,
  );

  return res.json(
    successResponse(
      "Order fetched successfully",
      data,
    ),
  );
};

export const getPublicActiveOrders = async (
  req: Request,
  res: Response,
) => {
  const qrToken = getRouteParam(
    req.params.qrToken,
  );

  const data =
    await publicService.getActiveOrders(
      qrToken,
      req.ip ?? "",
    );

  return res.json(
    successResponse(
      "Active orders fetched successfully",
      data,
    ),
  );
};

export const getPublicLoyaltyProgram = async (
  req: Request,
  res: Response,
) => {
  const qrToken = getRouteParam(
    req.params.qrToken,
  );

  const program =
    await publicService.getPublicLoyaltyProgram(
      qrToken,
    );

  return res.json(
    successResponse(
      "Loyalty program fetched successfully",
      program,
    ),
  );
};

export const getPublicCustomerLoyalty =
  async (
    req: Request,
    res: Response,
  ) => {
    const qrToken = getRouteParam(
      req.params.qrToken,
    );

    const phone = getRouteParam(
      req.params.phone,
    );

    const customer =
      await publicService.getPublicCustomerLoyalty(
        qrToken,
        phone,
      );

    return res.json(
      successResponse(
        "Customer loyalty profile fetched successfully",
        customer,
      ),
    );
  };