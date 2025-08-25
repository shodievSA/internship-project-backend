import { Router } from 'express';
import { RequestHandler } from 'express';
import summaryController from '../../controllers/summaryController';
import isAuthenticated from '../../middlewares/isAuthenticated';

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

// Get sprint progress (sprint progress bars)
router.get('/sprint-progress', 
    isAuthenticated, 
    summaryController.getSprintProgress as RequestHandler
);

// Get priority breakdown (priority bar chart)
router.get('/priority-breakdown', 
    isAuthenticated, 
    summaryController.getPriorityBreakdown as RequestHandler
);

// Get recent activity (activity summary cards)
router.get('/recent-activity', 
    isAuthenticated, 
    summaryController.getRecentActivity as RequestHandler
);

export default router; 