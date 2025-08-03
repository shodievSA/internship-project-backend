import { Router } from 'express';
import timeTrackingController from '../../../../controllers/timeTrackingController';
import isAuthenticated from '../../../../middlewares/isAuthenticated';

const router = Router();

router.post('/start', isAuthenticated, timeTrackingController.startTimer);
router.post('/stop', isAuthenticated, timeTrackingController.stopTimer);
router.get('/status', isAuthenticated, timeTrackingController.getTimerStatus);
router.get('/stats', isAuthenticated, timeTrackingController.getStats);

router.post('/manual-entry', isAuthenticated, timeTrackingController.createManualEntry);
router.put('/manual-entry/:entryId', isAuthenticated, timeTrackingController.updateManualEntry);
router.delete('/manual-entry/:entryId', isAuthenticated, timeTrackingController.deleteManualEntry);

export default router; 