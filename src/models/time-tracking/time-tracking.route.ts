import { Router } from 'express';
import { TimeTrackingController } from './time-tracking.controller';

const router = Router();
const controller = new TimeTrackingController();

// Time entry CRUD routes
router.post('/', controller.create.bind(controller));
router.post('/manual', controller.createManualEntry.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/stats', controller.getTimeStats.bind(controller));
router.get('/:id', controller.get.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

// Timer routes
router.post('/timer/start', controller.startTimer.bind(controller));
router.post('/timer/:userId/stop', controller.stopTimer.bind(controller));
router.get('/timer/:userId/status', controller.getTimerStatus.bind(controller));

// Reporting and analytics routes
router.get('/reports/generate', controller.generateReport.bind(controller));
router.get(
  '/team-productivity',
  controller.teamProductivityTrend.bind(controller)
);
router.get(
  '/team-activity-heatmap',
  controller.teamActivityHeatmap.bind(controller)
);

// User and task specific routes
router.get('/user/:userId', controller.getUserTimeEntries.bind(controller));
router.get('/task/:taskId', controller.getTaskTimeEntries.bind(controller));

export default router;
