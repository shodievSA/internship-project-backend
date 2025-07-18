import { RequestHandler, Router } from 'express';
import authRouter from './auth';
import aiRouter from './ai';
import userRouter from './me';
import projectRouter from './projects/index';
import isAuthenticated from '../../../middlewares/isAuthenticated';
import checkRedisAndUseLimiter from '@/middlewares/aiLimiter';

const router = Router();

router.use('/auth', authRouter);
router.use('/ai', isAuthenticated, checkRedisAndUseLimiter as RequestHandler, aiRouter);
router.use('/me', isAuthenticated, userRouter);
router.use('/projects', isAuthenticated, projectRouter);

export default router;