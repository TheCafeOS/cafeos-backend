import { Router } from 'express';
import { getPublicMenu } from '../controllers/publicController.js';

const router = Router();

router.get('/menu/:qrToken', getPublicMenu);

export default router;
