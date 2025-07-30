import { Request, Response, NextFunction } from 'express';
import AuthenticatedRequest from '../types/authenticatedRequest';
import summaryService from '../services/summaryService';

/**
 * Summary Controller
 * 
 * Handles project summary statistics and dashboard data endpoints.
 * Provides aggregated data from all active sprints for:
 * - Task status distribution (donut chart)
 * - Team workload distribution (bar chart)
 * 
 * All endpoints require authentication and project member permissions.
 */
class SummaryController {
    /**
     * Get Status Overview
     * 
     * Retrieves task status distribution for all active sprints in a project.
     * Combines data from multiple active sprints into a single overview.
     * 
     * @param req - Express request object with projectId in params
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - totalWorkItems: Total number of tasks across all active sprints
     * - statusDistribution: Count of tasks by status (ongoing, closed, underReview, overdue, rejected)
     * 
     * Used for: Status Overview donut chart in dashboard
     */
    async getStatusOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({ 
                    error: 'Invalid project ID' 
                });
            }

            const statusOverview = await summaryService.getStatusOverview(projectId);
            res.status(200).json(statusOverview);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Team Workload
     * 
     * Retrieves work distribution by assignee for all active sprints in a project.
     * Shows how tasks are distributed among team members and unassigned tasks.
     * 
     * @param req - Express request object with projectId in params
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - assignees: Array of team members with their work distribution percentage and task count
     * - unassigned: Work distribution and task count for unassigned tasks
     * 
     * Used for: Team Workload bar chart in dashboard
     */
    async getTeamWorkload(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({ 
                    error: 'Invalid project ID' 
                });
            }

            const teamWorkload = await summaryService.getTeamWorkload(projectId);
            res.status(200).json(teamWorkload);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Sprint Progress
     * 
     * Retrieves progress data for all sprints in a project.
     * Shows task status breakdown for each sprint with progress percentages.
     * 
     * @param req - Express request object with projectId in params
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - sprints: Array of sprints with their progress data including:
     *   - progress: Task counts by status (done, inProgress, toDo, total)
     *   - progressPercentage: Percentages for each status
     *   - taskBreakdown: Detailed breakdown for tooltips
     * 
     * Used for: Sprint Progress component in dashboard
     */
    async getSprintProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({ 
                    error: 'Invalid project ID' 
                });
            }

            const sprintProgress = await summaryService.getSprintProgress(projectId);
            res.status(200).json(sprintProgress);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Priority Breakdown
     * 
     * Retrieves priority distribution for all tasks in active sprints of a project.
     * Shows how tasks are distributed across different priority levels.
     * 
     * @param req - Express request object with projectId in params
     * @param res - Express response object
     * @param next - Express next function for error handling
     * 
     * @returns JSON response with:
     * - priorities: Array of priority levels with counts and percentages
     * - totalTasks: Total number of tasks across all active sprints
     * 
     * Used for: Priority Breakdown bar chart in dashboard
     */
    async getPriorityBreakdown(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({ 
                    error: 'Invalid project ID' 
                });
            }

            const priorityBreakdown = await summaryService.getPriorityBreakdown(projectId);
            res.status(200).json(priorityBreakdown);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Recent Activity
     * 
     * Retrieves recent activity metrics for a project over the last 7 days.
     * Shows completed, updated, created, and due soon task counts.
     * 
     * @param req - Express request object with projectId in params
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
     * Used for: Recent Activity summary cards in dashboard
     */
    async getRecentActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId);
            
            if (!projectId || isNaN(projectId)) {
                return res.status(400).json({ 
                    error: 'Invalid project ID' 
                });
            }

            const recentActivity = await summaryService.getRecentActivity(projectId);
            res.status(200).json(recentActivity);
        } catch (error) {
            next(error);
        }
    }
}

export default new SummaryController(); 