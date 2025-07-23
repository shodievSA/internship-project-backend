import { Router } from 'express';
import timeTrackingController from '../../../controllers/timeTrackingController';
import isAuthenticated from '../../../middlewares/isAuthenticated';

const router = Router();

router.post('/start', isAuthenticated, timeTrackingController.startTimer);
router.post('/stop', isAuthenticated, timeTrackingController.stopTimer);
router.get('/status', isAuthenticated, timeTrackingController.getTimerStatus);

export default router; 