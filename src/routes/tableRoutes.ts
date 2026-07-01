import { Router } from 'express';
import { createTable, deleteTable, listTables, updateTable } from '../controllers/tableController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listTables);
router.post('/', requireAuth, createTable);
router.put('/:id', requireAuth, updateTable);
router.delete('/:id', requireAuth, deleteTable);

export default router;
