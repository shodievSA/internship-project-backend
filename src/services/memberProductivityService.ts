import { models } from '../models';
import { AppError } from '@/types';
import { fn, col, literal } from 'sequelize';
import {
  MemberProductivityData,
  MemberProductivityFilters,
  TaskPerformanceMetrics,
  TimeTrackingAnalytics
} from '../types/memberProductivity';

class MemberProductivityService {
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  private async getTaskPerformanceMetrics(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ): Promise<TaskPerformanceMetrics> {
    // Base where clause for project and member
    const baseWhereClause: any = {
      projectId: projectId
    };

    // Add sprint filtering if provided (null means all sprints)
    if (filters?.sprintId !== undefined && filters?.sprintId !== null) {
      baseWhereClause.sprintId = filters.sprintId;
    }

    // Get all tasks for the member in the project
    const tasks = await models.Task.findAll({
      where: baseWhereClause,
      include: [{
        model: models.ProjectMember,
        as: 'assignedToMember',
        where: { userId: memberId },
        attributes: []
      }],
      attributes: ['id', 'status', 'priority', 'createdAt', 'updatedAt', 'deadline']
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'closed').length;
    const ongoingTasks = tasks.filter(task => task.status === 'ongoing').length;
    const overdueTasks = tasks.filter(task => task.status === 'overdue').length;
    const tasksUnderReview = tasks.filter(task => task.status === 'under review').length;
    const rejectedTasks = tasks.filter(task => task.status === 'rejected').length;

    const tasksByPriority = {
      high: tasks.filter(task => task.priority === 'high').length,
      middle: tasks.filter(task => task.priority === 'middle').length,
      low: tasks.filter(task => task.priority === 'low').length
    };

    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasksAssigned: totalTasks,
      completedTasks,
      ongoingTasks,
      overdueTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      tasksUnderReview,
      rejectedTasks,
      tasksByPriority
    };
  }

  private async getTimeTrackingAnalytics(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ): Promise<TimeTrackingAnalytics> {
    // Get all time entries for the member
    const timeEntries = await models.TimeEntry.findAll({
      where: { userId: memberId },
      include: [{
        model: models.Task,
        as: 'task',
        where: { 
          projectId,
          ...(filters?.sprintId !== undefined && filters?.sprintId !== null && { sprintId: filters.sprintId })
        },
        attributes: ['id', 'title']
      }],
      attributes: [
        'id',
        'start_time',
        'end_time',
        'duration',
        'task_id'
      ]
    });

    // Calculate total time logged
    const totalTimeLogged = timeEntries.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);

    // Calculate average session duration
    const completedSessions = timeEntries.filter(entry => entry.duration);
    const averageSessionDuration = completedSessions.length > 0 
      ? completedSessions.reduce((total, entry) => total + (entry.duration || 0), 0) / completedSessions.length
      : 0;

    // Get time per task
    const timePerTask = await this.getTimePerTask(memberId, projectId, filters);

    return {
      totalTimeLogged,
      totalTimeLoggedFormatted: this.formatDuration(totalTimeLogged),
      averageSessionDuration,
      averageSessionDurationFormatted: this.formatDuration(averageSessionDuration),
      timePerTask
    };
  }

  private async getTimePerTask(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const taskStats = await models.TimeEntry.findAll({
      where: { userId: memberId },
      include: [{
        model: models.Task,
        as: 'task',
        where: { 
          projectId,
          ...(filters?.sprintId !== undefined && filters?.sprintId !== null && { sprintId: filters.sprintId })
        },
        attributes: ['id', 'title']
      }],
      attributes: [
        'task_id',
        [fn('SUM', col('duration')), 'totalTime'],
        [fn('COUNT', col('TimeEntry.id')), 'sessions']
      ],
      group: ['task_id', 'task.id', 'task.title'],
      order: [[fn('SUM', col('duration')), 'DESC']],
      limit: 20 // Top 20 tasks by time
    });

    return taskStats.map(stat => ({
      taskId: stat.taskId,
      taskTitle: stat.task?.title || 'Unknown Task',
      totalTime: parseInt(String((stat as any).getDataValue('totalTime') || '0')),
      averageTimePerSession: parseInt(String((stat as any).getDataValue('totalTime') || '0')) / parseInt(String((stat as any).getDataValue('sessions') || '1'))
    }));
  }

  private async getSessionCount(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ): Promise<number> {
    const sessionCount = await models.TimeEntry.count({
      where: { userId: memberId },
      include: [{
        model: models.Task,
        as: 'task',
        where: { 
          projectId,
          ...(filters?.sprintId !== undefined && filters?.sprintId !== null && { sprintId: filters.sprintId })
        },
        attributes: []
      }]
    });

    return sessionCount;
  }

  private getDateInfo(): {
    day: string;
    month: string;
    dayOfWeek: string;
    relativeDate: string;
    fullDate: string;
  } {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const day = now.getDate().toString();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if it's yesterday
    const isYesterday = now.getDate() === yesterday.getDate() && 
                       now.getMonth() === yesterday.getMonth() && 
                       now.getFullYear() === yesterday.getFullYear();
    
    const relativeDate = isYesterday ? 'Yesterday' : 'Today';
    const fullDate = now.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return {
      day,
      month,
      dayOfWeek,
      relativeDate,
      fullDate
    };
  }

  getMemberProductivity = async (
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ): Promise<MemberProductivityData> => {
    try {
      // Validate parameters
      if (!memberId || isNaN(memberId) || !projectId || isNaN(projectId)) {
        throw new AppError('Invalid member ID or project ID', 400);
      }
      
      // Get member information
      const projectMember = await models.ProjectMember.findOne({
        where: {
          userId: memberId,
          projectId: projectId
        },
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'fullName', 'avatarUrl']
          },
          {
            model: models.Project,
            as: 'project',
            attributes: ['id', 'title']
          }
        ]
      });

      if (!projectMember) {
        throw new AppError('Member not found in this project', 404);
      }

      // Get task performance metrics
      const taskPerformance = await this.getTaskPerformanceMetrics(memberId, projectId, filters);

      // Get time tracking analytics
      const timeTracking = await this.getTimeTrackingAnalytics(memberId, projectId, filters);

      // Get session count
      const sessionCount = await this.getSessionCount(memberId, projectId, filters);

      // Get date information
      const dateInfo = this.getDateInfo();

      return {
        memberId: projectMember.user.id,
        memberName: projectMember.user.fullName || 'Unknown User',
        memberAvatar: projectMember.user.avatarUrl,
        projectId: projectMember.project.id,
        projectName: projectMember.project.title,
        role: projectMember.role,
        position: projectMember.position,
        busyLevel: projectMember.busyLevel,
        taskPerformance,
        timeTracking,
        dateInfo,
        sessionCount,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  getDefaultSprint = async (projectId: number): Promise<{
    id: number;
    title: string;
    description: string | null;
    status: 'planned' | 'active' | 'completed' | 'overdue';
    startDate: Date;
    endDate: Date;
  } | null> => {
    try {
      // First, try to find an active sprint
      const activeSprint = await models.Sprint.findOne({
        where: { 
          projectId: projectId,
          status: 'active'
        },
        attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
        order: [['created_at', 'DESC']] // If multiple active sprints, get the most recently created one
      });

      if (activeSprint) {
        return {
          id: activeSprint.id,
          title: activeSprint.title,
          description: activeSprint.description,
          status: activeSprint.status,
          startDate: activeSprint.startDate,
          endDate: activeSprint.endDate
        };
      }

      const latestSprint = await models.Sprint.findOne({
        where: { 
          projectId: projectId
        },
        attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
        order: [['endDate', 'DESC']]
      });

      if (latestSprint) {
        return {
          id: latestSprint.id,
          title: latestSprint.title,
          description: latestSprint.description,
          status: latestSprint.status,
          startDate: latestSprint.startDate,
          endDate: latestSprint.endDate
        };
      }

      return null; // No sprints found
    } catch (error) {
      throw error;
    }
  }

  getAllSprints = async (projectId: number): Promise<Array<{
    id: number;
    title: string;
    description: string | null;
    status: 'planned' | 'active' | 'completed' | 'overdue';
    startDate: Date;
    endDate: Date;
  }>> => {
    try {
      const sprints = await models.Sprint.findAll({
        where: { 
          projectId: projectId
        },
        attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
        order: [['created_at', 'ASC']]
      });

      return sprints.map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        description: sprint.description,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate
      }));

    } catch (error) {
      throw error;
    }
  }
}

export default new MemberProductivityService(); 