import { Router } from 'express';
import aiController from '../../../controllers/aiController';

const router = Router();

router.post('/enhance', aiController.enhanceText);

export default router;