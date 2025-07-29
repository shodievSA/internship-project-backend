import { models } from '../models';
import { AppError } from '../types/customError';

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
    async getStatusOverview(projectId: number): Promise<StatusOverviewResponse> {
        try {
            // Get all planned and active sprints
            const sprints = await models.Sprint.findAll({
                where: { 
                    projectId, 
                    status: ['planned', 'active'] 
                },
                include: [{
                    model: models.Task,
                    as: 'tasks',
                    attributes: ['id', 'status']
                }]
            });

            // Combine all tasks from planned and active sprints
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

    async getTeamWorkload(projectId: number): Promise<TeamWorkloadResponse> {
        try {
            console.log(`[getTeamWorkload] Starting request for projectId: ${projectId}`);
            
            // Get all planned and active sprints
            const activeSprints = await models.Sprint.findAll({
                where: { 
                    projectId, 
                    status: ['planned', 'active'] 
                },
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

            console.log(`[getTeamWorkload] Found ${activeSprints.length} active sprints for project ${projectId}`);

            // Combine all tasks from active sprints
            const allTasks = activeSprints.flatMap(sprint => sprint.tasks);
            const totalTasks = allTasks.length;

            console.log(`[getTeamWorkload] Total tasks found: ${totalTasks}`);
            console.log(`[getTeamWorkload] Tasks data:`, allTasks.map(task => ({
                id: task?.id,
                status: task?.status,
                assignedToMember: task?.assignedToMember ? {
                    id: task.assignedToMember.id,
                    userName: task.assignedToMember.user?.fullName
                } : null
            })));

            if (totalTasks === 0) {
                console.log(`[getTeamWorkload] No tasks found, returning empty response`);
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

            console.log(`[getTeamWorkload] Assignee map:`, Array.from(assigneeMap.entries()));
            console.log(`[getTeamWorkload] Unassigned count: ${unassignedCount}`);

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

            console.log(`[getTeamWorkload] Final result:`, result);
            return result;
        } catch (error) {
            console.error(`[getTeamWorkload] Error:`, error);
            throw new AppError('Failed to get team workload');
        }
    }
}

export default new SummaryService(); 