import { RequestHandler, Router } from 'express';
import authRouter from './auth';
import meRouter from './me';
import projectsRouter from './projects';
import aiRouter from './ai';
import userRouter from './me';
import projectRouter from './projects/index';
import isAuthenticated from '../../../middlewares/isAuthenticated';
import checkRedisAndUseLimiter from '@/middlewares/aiLimiter';
import timerRouter from './projects/timer';

const router = Router();

router.use('/auth', authRouter);
router.use('/ai', isAuthenticated, checkRedisAndUseLimiter as RequestHandler, aiRouter);
router.use('/me', isAuthenticated, userRouter);
router.use('/projects', isAuthenticated, projectRouter);
router.use('/me', meRouter);
router.use('/projects', projectsRouter);
router.use('/ai', aiRouter);
router.use('/timer', timerRouter);

export default router;