import { Router } from 'express';
import { RequestHandler } from 'express';
import summaryController from '../../../../controllers/summaryController';
import isAuthenticated from '../../../../middlewares/isAuthenticated';

const router = Router({ mergeParams: true });

// Get status overview (donut chart data)
router.get('/status-overview', 
    isAuthenticated, 
    summaryController.getStatusOverview as RequestHandler
);

// Get team workload (bar chart data)
router.get('/team-workload', 
    isAuthenticated, 
    summaryController.getTeamWorkload as RequestHandler
);

export default router; 