import { Request, Response, NextFunction } from 'express';
import summaryService from '../services/summaryService';
import { AppError } from '@/types';

/**
 * Summary Controller
 * 
 * Handles project summary statistics and dashboard data endpoints.
 * Provides aggregated data from sprints for:
 * - Task status distribution (donut chart)
 * - Team workload distribution (bar chart)
 * 
 * All endpoints support optional sprint filtering via query parameter 'sprintId'.
 * If sprintId is provided, data is filtered to that specific sprint.
 * If no sprintId is provided, data includes all sprints regardless of status.
 * 
 * All endpoints require authentication and project member permissions.
 */
class SummaryController {
    /**
     * Get Status Overview
     * 
     * Retrieves task status distribution for sprints in a project.
     * Can be filtered by specific sprint using query parameter 'sprintId'.
     * 
     * @param req - Express request object with projectId in params and optional sprintId in query
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - totalWorkItems: Total number of tasks across filtered sprints
     * - statusDistribution: Count of tasks by status (ongoing, closed, underReview, overdue, rejected)
     * 
     * Query Parameters:
     * - sprintId (optional): Filter data to specific sprint
     * 
     * Used for: Status Overview donut chart in dashboard
     */
    async getStatusOverview(
		req: Request, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const projectId = parseInt(req.params.projectId);
            const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
            
            if (!projectId || isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
            if (sprintId && isNaN(sprintId)) throw new AppError("Invalid sprint id", 400, true);

            const statusOverview = await summaryService.getStatusOverview(projectId, sprintId);

            res.status(200).json(statusOverview);

        } catch (err) {

            next(err);

        }

    }

    /**
     * Get Team Workload
     * 
     * Retrieves work distribution by assignee for sprints in a project.
     * Can be filtered by specific sprint using query parameter 'sprintId'.
     * Shows how tasks are distributed among team members and unassigned tasks.
     * 
     * @param req - Express request object with projectId in params and optional sprintId in query
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - assignees: Array of team members with their work distribution percentage and task count
     * - unassigned: Work distribution and task count for unassigned tasks
     * 
     * Query Parameters:
     * - sprintId (optional): Filter data to specific sprint
     * 
     * Used for: Team Workload bar chart in dashboard
     */
    async getTeamWorkload(
		req: Request, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const projectId = parseInt(req.params.projectId);
            const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
            
            if (!projectId || isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
            if (sprintId && isNaN(sprintId)) throw new AppError("Invalid sprint id", 400, true);

            const teamWorkload = await summaryService.getTeamWorkload(projectId, sprintId);

            res.status(200).json(teamWorkload);

        } catch (err) {

            next(err);

        }

    }

    /**
     * Get Sprint Progress
     * 
     * Retrieves progress data for sprints in a project.
     * Can be filtered by specific sprint using query parameter 'sprintId'.
     * Shows task status breakdown for each sprint with progress percentages.
     * 
     * @param req - Express request object with projectId in params and optional sprintId in query
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - sprints: Array of sprints with their progress data including:
     *   - progress: Task counts by status (done, inProgress, toDo, total)
     *   - progressPercentage: Percentages for each status
     *   - taskBreakdown: Detailed breakdown for tooltips
     * 
     * Query Parameters:
     * - sprintId (optional): Filter data to specific sprint
     * 
     * Used for: Sprint Progress component in dashboard
     */
    async getSprintProgress(
		req: Request, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const projectId = parseInt(req.params.projectId);
            const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
            
            if (!projectId || isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
            if (sprintId && isNaN(sprintId)) throw new AppError("Invalid sprint id", 400, true);

            const sprintProgress = await summaryService.getSprintProgress(projectId, sprintId);

            res.status(200).json(sprintProgress);

        } catch (err) {

            next(err);

        }

    }

    /**
     * Get Priority Breakdown
     * 
     * Retrieves priority distribution for all tasks in sprints of a project.
     * Can be filtered by specific sprint using query parameter 'sprintId'.
     * Shows how tasks are distributed across different priority levels.
     * 
     * @param req - Express request object with projectId in params and optional sprintId in query
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - priorities: Array of priority levels with counts and percentages
     * - totalTasks: Total number of tasks across filtered sprints
     * 
     * Query Parameters:
     * - sprintId (optional): Filter data to specific sprint
     * 
     * Used for: Priority Breakdown bar chart in dashboard
     */
    async getPriorityBreakdown(
		req: Request, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const projectId = parseInt(req.params.projectId);
            const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
            
            if (!projectId || isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
            if (sprintId && isNaN(sprintId)) throw new AppError("Invalid sprint id", 400, true);

            const priorityBreakdown = await summaryService.getPriorityBreakdown(projectId, sprintId);

            res.status(200).json(priorityBreakdown);

        } catch (err) {

            next(err);

        }

    }

    /**
     * Get Recent Activity
     * 
     * Retrieves recent activity metrics for a project over the last 7 days.
     * Can be filtered by specific sprint using query parameter 'sprintId'.
     * Shows completed, updated, created, and due soon task counts.
     * 
     * @param req - Express request object with projectId in params and optional sprintId in query
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - recentActivity: Object containing activity counts for different metrics
     *   - completed: Tasks completed in last 7 days
     *   - updated: Tasks updated in last 7 days
     *   - created: Tasks created in last 7 days
     *   - dueSoon: Tasks due in next 7 days
     * 
     * Query Parameters:
     * - sprintId (optional): Filter data to specific sprint
     * 
     * Used for: Recent Activity summary cards in dashboard
     */
    async getRecentActivity(
		req: Request, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const projectId = parseInt(req.params.projectId);
            const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
            
            if (!projectId || isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
            if (sprintId && isNaN(sprintId)) throw new AppError("Invalid sprint id", 400, true);

            const recentActivity = await summaryService.getRecentActivity(projectId, sprintId);

            res.status(200).json(recentActivity);

        } catch (err) {

            next(err);

        }

    }

}

export default new SummaryController(); 