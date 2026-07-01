import { Router } from 'express';
import { createMenuItem, deleteMenuItem, listMenuItems, updateMenuItem } from '../controllers/menuController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listMenuItems);
router.post('/', requireAuth, createMenuItem);
router.put('/:id', requireAuth, updateMenuItem);
router.delete('/:id', requireAuth, deleteMenuItem);

export default router;
