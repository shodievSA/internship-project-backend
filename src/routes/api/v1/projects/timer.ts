import { Router } from 'express';
import timeTrackingController from '../../../../controllers/timeTrackingController';
import isAuthenticated from '../../../../middlewares/isAuthenticated';

const router = Router({ mergeParams: true });

router.get('/:userId/status', isAuthenticated, timeTrackingController.getUserTimerStatus);

export default router; 