import { Router } from 'express';
import authRouter from './auth';
import meRouter from './me';
import projectsRouter from './projects';
import aiRouter from './ai';
import timerRouter from './timer';

const router = Router();

router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/projects', projectsRouter);
router.use('/ai', aiRouter);
router.use('/timer', timerRouter);

export default router;