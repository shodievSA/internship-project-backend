import { RequestHandler, Router } from 'express';
import aiController from '../../../controllers/aiController';

const {
	enhanceText,
    createTitle
} = aiController;

const router = Router();

router.post('/enhance', enhanceText as RequestHandler);
router.post('/generate-tasks-title', createTitle as RequestHandler)

export default router;