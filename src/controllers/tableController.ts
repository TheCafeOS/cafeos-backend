import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.js";
import * as tableService from "../services/table.service.js";
import * as tableMergeService from "../services/tableMerge.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { getRouteParam } from "../utils/request.js";

export const listTables = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const tables = await tableService.getTables(
    req.employee!.restaurantId,
  );

  return res.json(
    successResponse(
      "Tables fetched successfully",
      tables,
    ),
  );
};

export const createTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {

  const table = 
  await tableService.addTable(
    req.employee!.restaurantId,
    req.employee!.id,
    req.body.name,
  );

  return res.status(201).json(
    successResponse(
      "Table created successfully",
      table,
    ),
  );
};

export const updateTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const table = await tableService.editTable(
    req.employee!.restaurantId,
    req.employee!.id,
    id,
    req.body,
  );

  return res.json(
    successResponse(
      "Table updated successfully",
      table,
    ),
  );
};

export const deleteTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  await tableService.removeTable(
    req.employee!.restaurantId,
    req.employee!.id,
    id,
  );

return res.sendStatus(204);
};

export const downloadQr = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const png = await tableService.generateTableQr(
    req.employee!.restaurantId,
    id,
  );

  res.setHeader(
    "Content-Type",
    "image/png",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="table-${id}.png"`,
  );

  res.send(png);
};

export const listTableMerges = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const merges =
  await tableMergeService.listTableMerges(
    req.employee!.restaurantId,
  );

  return res.json(
    successResponse(
      "Table merges fetched successfully",
      merges,
    ),
  );
};

export const getTableMerge = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const mergeId = getRouteParam(
    req.params.mergeId,
  );

  const merge =
    await tableMergeService.getTableMerge(
      req.employee!.restaurantId,
      mergeId,
    );

  return res.json(
    successResponse(
      "Table merge fetched successfully",
      merge,
    ),
  );
};

export const mergeTables = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const merge =
    await tableMergeService.mergeTables(
      req.employee!.restaurantId,
      req.employee!.id,
      req.body.tableIds,
    );

  return res.status(201).json(
    successResponse(
      "Tables merged successfully",
      merge,
    ),
  );
};

export const unmergeTables = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const mergeId = getRouteParam(
    req.params.mergeId,
  );

  const merge =
    await tableMergeService.unmergeTables(
      req.employee!.restaurantId,
      req.employee!.id,
      mergeId,
    );

  return res.json(
    successResponse(
      "Tables unmerged successfully",
      merge,
    ),
  );
};