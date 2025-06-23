import { Router, RequestHandler } from 'express';
import userController from '../../../controllers/userController';

const {
	getMe
} = userController;

const router = Router();

router.get('/', getMe as RequestHandler);

export default router;