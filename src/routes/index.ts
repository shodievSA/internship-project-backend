import { Router } from 'express';
import authRouter from './auth';
import aiRouter from './ai';
import userRouter from './me';
import projectRouter from './projects/index';
import isAuthenticated from '../middlewares/isAuthenticated';
import aiRateLimiter from '@/middlewares/aiRateLimiter';
import timerRouter from './projects/timer';

const router = Router();

router.use('/v1/auth', authRouter);
router.use('/v1/ai', isAuthenticated, aiRateLimiter, aiRouter);
router.use('/v1/me', isAuthenticated, userRouter);
router.use('/v1/projects', isAuthenticated, projectRouter);
router.use('/v1/timer', timerRouter);

export default router;