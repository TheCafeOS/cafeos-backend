import { Router } from "express";

import {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  listNotificationsSchema,
  notificationIdSchema,
} from "../validations/notification.validation.js";

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List notifications
 *     description: Returns paginated notifications for the authenticated employee.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - NEW_ORDER
 *             - ORDER_STATUS
 *             - LOYALTY_REWARD
 *             - EMPLOYEE_ACTIVITY
 *     responses:
 *       200:
 *         description: Notifications fetched successfully.
 */
router.get(
  "/",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(listNotificationsSchema),
  asyncHandler(listNotifications),
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count fetched successfully.
 */
router.get(
  "/unread-count",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(getUnreadCount),
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 */
router.patch(
  "/read-all",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  asyncHandler(markAllNotificationsAsRead),
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read.
 */
router.patch(
  "/:id/read",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(notificationIdSchema),
  asyncHandler(markNotificationAsRead),
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted successfully.
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("OWNER", "MANAGER", "STAFF"),
  validate(notificationIdSchema),
  asyncHandler(deleteNotification),
);

export default router;