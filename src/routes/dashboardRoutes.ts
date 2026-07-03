import { Router } from 'express';
import {
  getTodayStats,
  getRecentOrders,
  getOrdersByStatus,
  getDashboardSummary,
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/today', requireAuth, getTodayStats);
router.get('/orders/status', requireAuth, getOrdersByStatus);
router.get('/orders/recent', requireAuth, getRecentOrders);
router.get('/summary', requireAuth, getDashboardSummary);

export default router;
