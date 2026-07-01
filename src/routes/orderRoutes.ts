import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/', requireAuth, listOrders);
router.get('/:id', requireAuth, getOrder);
router.patch('/:id/status', requireAuth, updateOrderStatus);

export default router;
