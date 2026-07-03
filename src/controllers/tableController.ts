import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as tableService from "../services/table.service.js";

export const listTables = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const tables = await tableService.getTables(
    req.employee!.restaurantId,
  );

  return res.json(tables);
};

export const createTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Table name is required",
    });
  }

  const table = await tableService.addTable(
    req.employee!.restaurantId,
    name,
  );

  return res.status(201).json(table);
};

export const updateTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const table = await tableService.editTable(
    req.employee!.restaurantId,
    id,
    req.body,
  );

  if (!table) {
    return res.status(404).json({
      message: "Table not found",
    });
  }

  return res.json(table);
};

export const deleteTable = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const deleted = await tableService.removeTable(
    req.employee!.restaurantId,
    id,
  );

  if (!deleted) {
    return res.status(404).json({
      message: "Table not found",
    });
  }

  return res.sendStatus(204);
};