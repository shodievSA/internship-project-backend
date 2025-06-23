import { RequestHandler, Router } from 'express';
import aiController from '../../../controllers/aiController';

const {
	enhanceText
} = aiController;

const router = Router();

router.post('/enhance', enhanceText as RequestHandler);

export default router;