import { models } from '../models';
import { AppError } from '../types/customError';
import { SprintProgressResponse, PriorityBreakdownResponse, RecentActivityResponse } from '../types/summary';

export interface StatusOverviewResponse {
    totalWorkItems: number;
    statusDistribution: {
        ongoing: number;
        closed: number;
        underReview: number;
        overdue: number;
        rejected: number;
    };
}

export interface TeamWorkloadResponse {
    assignees: Array<{
        id: number;
        name: string;
        avatarUrl: string | null;
        workDistribution: number; // percentage
        taskCount: number;
    }>;
    unassigned: {
        workDistribution: number;
        taskCount: number;
    };
}

class SummaryService {
    async getStatusOverview(projectId: number, sprintId?: number): Promise<StatusOverviewResponse> {
        try {
            // Build where clause for sprints
            const sprintWhereClause: any = { projectId };
            if (sprintId) {
                sprintWhereClause.id = sprintId;
            } else {
                // If no sprintId provided, get all sprints regardless of status
                sprintWhereClause.status = ['planned', 'active', 'completed', 'overdue'];
            }

            // Get sprints based on filter
            const sprints = await models.Sprint.findAll({
                where: sprintWhereClause,
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    attributes: ['id', 'status']
                }]
            });

            // Combine all tasks from sprints
            const allTasks = sprints.flatMap(sprint => sprint.tasks);
            
            const statusCounts = {
                ongoing: allTasks.filter(t => t && t.status === 'ongoing').length,
                closed: allTasks.filter(t => t && t.status === 'closed').length,
                underReview: allTasks.filter(t => t && t.status === 'under review').length,
                overdue: allTasks.filter(t => t && t.status === 'overdue').length,
                rejected: allTasks.filter(t => t && t.status === 'rejected').length
            };

            return {
                totalWorkItems: allTasks.length,
                statusDistribution: statusCounts
            };
        } catch (error) {
            throw new AppError('Failed to get status overview');
        }
    }

    async getTeamWorkload(projectId: number, sprintId?: number): Promise<TeamWorkloadResponse> {
        try {
            // Build where clause for sprints
            const sprintWhereClause: any = { projectId };
            if (sprintId) {
                sprintWhereClause.id = sprintId;
            } else {
                // If no sprintId provided, get all sprints regardless of status
                sprintWhereClause.status = ['planned', 'active', 'completed', 'overdue'];
            }

            // Get sprints based on filter
            const sprints = await models.Sprint.findAll({
                where: sprintWhereClause,
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    include: [{
                        model: models.ProjectMember,
                        as: 'assignedToMember',
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['fullName', 'avatarUrl']
                        }]
                    }]
                }]
            });

            // Combine all tasks from sprints
            const allTasks = sprints.flatMap(sprint => sprint.tasks);
            const totalTasks = allTasks.length;

            if (totalTasks === 0) {
                return {
                    assignees: [],
                    unassigned: {
                        workDistribution: 0,
                        taskCount: 0
                    }
                };
            }

            // Group tasks by assignee
            const assigneeMap = new Map();
            let unassignedCount = 0;

            allTasks.forEach((task) => {
                if (task && task.assignedToMember) {
                    const assigneeId = task.assignedToMember.id;
                    const assigneeName = task.assignedToMember.user.fullName;
                    const avatarUrl = task.assignedToMember.user.avatarUrl;

                    if (!assigneeMap.has(assigneeId)) {
                        assigneeMap.set(assigneeId, {
                            id: assigneeId,
                            name: assigneeName,
                            avatarUrl,
                            taskCount: 0
                        });
                    }
                    assigneeMap.get(assigneeId).taskCount++;
                } else {
                    unassignedCount++;
                }
            });

            // Calculate work distribution percentages
            const assignees = Array.from(assigneeMap.values()).map(assignee => ({
                ...assignee,
                workDistribution: Math.round((assignee.taskCount / totalTasks) * 100)
            }));

            const result = {
                assignees,
                unassigned: {
                    workDistribution: Math.round((unassignedCount / totalTasks) * 100),
                    taskCount: unassignedCount
                }
            };

            return result;
        } catch (error) {
            throw new AppError('Failed to get team workload');
        }
    }

    async getSprintProgress(projectId: number, sprintId?: number): Promise<SprintProgressResponse> {
        try {
            // Build where clause for sprints
            const sprintWhereClause: any = { projectId };
            if (sprintId) {
                sprintWhereClause.id = sprintId;
            } else {
                // If no sprintId provided, get all sprints regardless of status
                sprintWhereClause.status = ['planned', 'active', 'completed', 'overdue'];
            }

            // Get sprints based on filter
            const sprints = await models.Sprint.findAll({
                where: sprintWhereClause,
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    attributes: ['id', 'status']
                }],
                order: [['created_at', 'ASC']]
            });

            const sprintProgress = sprints.map(sprint => {
                const tasks = sprint.tasks || [];
                const totalTasks = tasks.length;

                // Count tasks by status
                const completedTasks = tasks.filter(task => task.status === 'closed').length;
                const activeTasks = tasks.filter(task => 
                    task.status === 'ongoing' || task.status === 'under review'
                ).length;
                // Blocked/Stuck tasks = tasks that are rejected or overdue (not actively being worked on)
                const blockedTasks = tasks.filter(task => 
                    task.status === 'rejected' || task.status === 'overdue'
                ).length;

                // Calculate percentages
                const donePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const inProgressPercentage = totalTasks > 0 ? Math.round((activeTasks / totalTasks) * 100) : 0;
                const toDoPercentage = totalTasks > 0 ? Math.round((blockedTasks / totalTasks) * 100) : 0;

                return {
                    id: sprint.id,
                    title: sprint.title,
                    description: sprint.description,
                    progress: {
                        completed: completedTasks,
                        active: activeTasks,
                        blocked: blockedTasks,
                        total: totalTasks
                    },
                    progressPercentage: {
                        completed: donePercentage,
                        active: inProgressPercentage,
                        blocked: toDoPercentage
                    },
                    taskBreakdown: {
                        active: activeTasks,
                        blocked: blockedTasks
                    }
                };
            });

            return { sprints: sprintProgress };
        } catch (error) {
            throw new AppError('Failed to get sprint progress');
        }
    }

    async getPriorityBreakdown(projectId: number, sprintId?: number): Promise<PriorityBreakdownResponse> {
        try {
            // Build where clause for sprints
            const sprintWhereClause: any = { projectId };
            if (sprintId) {
                sprintWhereClause.id = sprintId;
            } else {
                // If no sprintId provided, get all sprints regardless of status
                sprintWhereClause.status = ['planned', 'active', 'completed', 'overdue'];
            }

            // Get sprints based on filter
            const sprints = await models.Sprint.findAll({
                where: sprintWhereClause,
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    attributes: ['id', 'priority']
                }]
            });

            // Combine all tasks from sprints
            const allTasks = sprints.flatMap(sprint => sprint.tasks);
            const totalTasks = allTasks.length;

            // Count tasks by priority
            const priorityCounts = {
                high: allTasks.filter(task => task && task.priority === 'high').length,
                middle: allTasks.filter(task => task && task.priority === 'middle').length,
                low: allTasks.filter(task => task && task.priority === 'low').length
            };

            // Map to chart format (matching your actual task priorities)
            const priorities = [
                {
                    level: 'high' as const,
                    icon: '^',
                    count: priorityCounts.high,
                    percentage: totalTasks > 0 ? Math.round((priorityCounts.high / totalTasks) * 100) : 0
                },
                {
                    level: 'middle' as const,
                    icon: '=',
                    count: priorityCounts.middle,
                    percentage: totalTasks > 0 ? Math.round((priorityCounts.middle / totalTasks) * 100) : 0
                },
                {
                    level: 'low' as const,
                    icon: 'v',
                    count: priorityCounts.low,
                    percentage: totalTasks > 0 ? Math.round((priorityCounts.low / totalTasks) * 100) : 0
                }
            ];

            return {
                priorities,
                totalTasks
            };
        } catch (error) {
            throw new AppError('Failed to get priority breakdown');
        }
    }

    async getRecentActivity(projectId: number, sprintId?: number): Promise<RecentActivityResponse> {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Build where clause for sprints
            const sprintWhereClause: any = { projectId };
            if (sprintId) {
                sprintWhereClause.id = sprintId;
            } else {
                // If no sprintId provided, get all sprints regardless of status
                sprintWhereClause.status = ['planned', 'active', 'completed', 'overdue'];
            }

            // Get sprints based on filter
            const sprints = await models.Sprint.findAll({
                where: sprintWhereClause,
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    attributes: ['id', 'status', 'createdAt', 'updatedAt', 'deadline']
                }]
            });

            // Combine all tasks from sprints
            const allTasks = sprints.flatMap(sprint => sprint.tasks || []);

            // Count completed tasks in last 7 days
            const completedTasks = allTasks.filter(task => 
                task.status === 'closed' && 
                task.updatedAt >= sevenDaysAgo
            ).length;

            // Count updated tasks in last 7 days (status changes only)
            const updatedTasks = allTasks.filter(task => 
                task.updatedAt >= sevenDaysAgo
            ).length;

            // Count created tasks in last 7 days
            const createdTasks = allTasks.filter(task => {
                const isWithin7Days = task.createdAt >= sevenDaysAgo;
                return isWithin7Days;
            }).length;

            // Count tasks due soon (next 7 days) that are not completed
            const dueSoonTasks = allTasks.filter(task => 
                task.deadline <= sevenDaysFromNow && 
                task.deadline >= now && 
                task.status !== 'closed'
            ).length;

            return {
                recentActivity: {
                    completed: {
                        count: completedTasks,
                        period: 'last7days'
                    },
                    updated: {
                        count: updatedTasks,
                        period: 'last7days'
                    },
                    created: {
                        count: createdTasks,
                        period: 'last7days'
                    },
                    dueSoon: {
                        count: dueSoonTasks,
                        period: 'next7days'
                    }
                }
            };
        } catch (error) {
            throw new AppError('Failed to get recent activity');
        }
    }
}

export default new SummaryService();
