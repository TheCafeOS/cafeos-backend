import { Response } from "express";
import { NotificationType } from "@prisma/client";

import { AuthenticatedRequest } from "../middleware/auth.js";
import * as notificationService from "../services/notification.service.js";

import { successResponse } from "../utils/apiResponse.js";
import { getPaginationParams } from "../utils/pagination.js";
import { getRouteParam } from "../utils/request.js";

export const listNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { page, limit } = getPaginationParams(
    req.query.page as string | undefined,
    req.query.limit as string | undefined,
  );

  const result =
    await notificationService.getNotifications({
      employeeId: req.employee!.id,
      page,
      limit,
      isRead:
        req.query.isRead === undefined
          ? undefined
          : req.query.isRead === "true",
      type: req.query.type as
        | NotificationType
        | undefined,
    });

  return res.json(
    successResponse(
      "Notifications fetched successfully",
      result.data,
      result.pagination,
    ),
  );
};

export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result =
    await notificationService.getUnreadCount(
      req.employee!.id,
    );

  return res.json(
    successResponse(
      "Unread notification count fetched successfully",
      result,
    ),
  );
};

export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  const notification =
    await notificationService.markAsRead(
      id,
      req.employee!.id,
    );

  return res.json(
    successResponse(
      "Notification marked as read",
      notification,
    ),
  );
};

export const markAllNotificationsAsRead =
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    const result =
      await notificationService.markAllAsRead(
        req.employee!.id,
      );

    return res.json(
      successResponse(
        "All notifications marked as read",
        result,
      ),
    );
  };

export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = getRouteParam(req.params.id);

  await notificationService.deleteNotification(
    id,
    req.employee!.id,
  );

  return res.sendStatus(204);
};