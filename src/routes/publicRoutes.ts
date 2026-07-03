import { Router } from 'express';
import { getPublicMenu, createPublicOrder, getPublicOrder } from '../controllers/publicController.js';

const router = Router();

router.get('/menu/:qrToken', getPublicMenu);
router.post("/orders/:qrToken", createPublicOrder);
router.get('/orders/:qrToken/:orderId', getPublicOrder);

export default router;
