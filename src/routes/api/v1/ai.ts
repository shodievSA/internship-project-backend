import { Router } from 'express';
import aiController from '../../../controllers/aiController';

const router = Router();

router.post('/enhance', aiController.EnhanceText);

export default router;