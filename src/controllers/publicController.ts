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
        table: order.table.name,
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