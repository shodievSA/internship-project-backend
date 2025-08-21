import { RequestHandler, Router } from 'express';
import timeTrackingController from '../../../../controllers/timeTrackingController';
import isAuthenticated from '../../../../middlewares/isAuthenticated';

const router = Router();

router.post('/start', isAuthenticated, timeTrackingController.startTimer as RequestHandler);
router.post('/stop', isAuthenticated, timeTrackingController.stopTimer as RequestHandler);
router.get('/status', isAuthenticated, timeTrackingController.getTimerStatus as RequestHandler);
router.get('/stats', isAuthenticated, timeTrackingController.getStats as RequestHandler);

router.post('/manual-entry', isAuthenticated, timeTrackingController.createManualEntry as RequestHandler);
router.put('/manual-entry/:entryId', isAuthenticated, timeTrackingController.updateManualEntry as RequestHandler);
router.delete('/manual-entry/:entryId', isAuthenticated, timeTrackingController.deleteManualEntry as RequestHandler);

export default router; 