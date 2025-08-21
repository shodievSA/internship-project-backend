import { RequestHandler, Router } from 'express';
import aiController from '../../../controllers/aiController';

const {
	enhanceText,
    generateTaskTitle
} = aiController;

const router = Router();

router.post('/enhance', enhanceText as RequestHandler);
router.post('/generate-task-title', generateTaskTitle as RequestHandler);

export default router;