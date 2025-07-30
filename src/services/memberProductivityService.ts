import { models } from '../models';
import { AppError } from '@/types';
import { Op, fn, col, literal } from 'sequelize';
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
    const whereClause: any = {
      projectId: projectId
    };

    if (filters?.dateRange) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const tasks = await models.Task.findAll({
      where: whereClause,
      include: [{
        model: models.ProjectMember,
        as: 'assignedToMember',
        where: { userId: memberId },
        attributes: []
      }],
      attributes: ['status', 'priority']
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
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    // Get all time entries for the member
    const timeEntries = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
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

    // Daily time distribution
    const dailyTimeDistribution = await this.getDailyTimeDistribution(memberId, projectId, filters);

    // Weekly time distribution
    const weeklyTimeDistribution = await this.getWeeklyTimeDistribution(memberId, projectId, filters);

    // Monthly time distribution
    const monthlyTimeDistribution = await this.getMonthlyTimeDistribution(memberId, projectId, filters);

    // Time per task
    const timePerTask = await this.getTimePerTask(memberId, projectId, filters);

    // Productivity hours
    const productivityHours = await this.getProductivityHours(memberId, projectId, filters);

    return {
      totalTimeLogged,
      totalTimeLoggedFormatted: this.formatDuration(totalTimeLogged),
      averageSessionDuration,
      averageSessionDurationFormatted: this.formatDuration(averageSessionDuration),
      dailyTimeDistribution,
      weeklyTimeDistribution,
      monthlyTimeDistribution,
      timePerTask,
      productivityHours
    };
  }

  private async getDailyTimeDistribution(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const dailyStats = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
        attributes: []
      }],
      attributes: [
        [fn('DATE', col('start_time')), 'date'],
        [fn('SUM', col('duration')), 'totalTime'],
        [fn('COUNT', col('TimeEntry.id')), 'sessions']
      ],
      group: [fn('DATE', col('start_time'))],
      order: [[fn('DATE', col('start_time')), 'DESC']],
      limit: 30 // Last 30 days
    });

    return dailyStats.map(stat => {
      const dateValue = (stat as any).getDataValue('date');
      const totalTimeValue = (stat as any).getDataValue('totalTime');
      const sessionsValue = (stat as any).getDataValue('sessions');
      
      return {
        date: dateValue ? String(dateValue) : '',
        totalTime: parseInt(String(totalTimeValue || '0')),
        sessions: parseInt(String(sessionsValue || '0'))
      };
    });
  }

  private async getWeeklyTimeDistribution(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const weeklyStats = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
        attributes: []
      }],
      attributes: [
        [fn('TO_CHAR', col('start_time'), literal("'IYYY-IW'")), 'week'],
        [fn('SUM', col('duration')), 'totalTime'],
        [fn('COUNT', fn('DISTINCT', fn('DATE', col('start_time')))), 'daysWorked']
      ],
      group: [fn('TO_CHAR', col('start_time'), literal("'IYYY-IW'"))],
      order: [[fn('TO_CHAR', col('start_time'), literal("'IYYY-IW'")), 'DESC']],
      limit: 12 // Last 12 weeks
    });

    return weeklyStats.map(stat => {
      const weekValue = (stat as any).getDataValue('week');
      const totalTimeValue = (stat as any).getDataValue('totalTime');
      const daysWorkedValue = (stat as any).getDataValue('daysWorked');
      
      const totalTime = parseInt(String(totalTimeValue || '0')) || 0;
      const daysWorked = parseInt(String(daysWorkedValue || '1')) || 1;
      
      return {
        week: weekValue ? String(weekValue) : '',
        totalTime,
        averageDailyTime: totalTime / daysWorked
      };
    });
  }

  private async getMonthlyTimeDistribution(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const monthlyStats = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
        attributes: []
      }],
      attributes: [
        [fn('TO_CHAR', col('start_time'), literal("'YYYY-MM'")), 'month'],
        [fn('SUM', col('duration')), 'totalTime'],
        [fn('COUNT', fn('DISTINCT', fn('DATE', col('start_time')))), 'daysWorked']
      ],
      group: [fn('TO_CHAR', col('start_time'), literal("'YYYY-MM'"))],
      order: [[fn('TO_CHAR', col('start_time'), literal("'YYYY-MM'")), 'DESC']],
      limit: 12 // Last 12 months
    });

    return monthlyStats.map(stat => {
      const monthValue = (stat as any).getDataValue('month');
      const totalTimeValue = (stat as any).getDataValue('totalTime');
      const daysWorkedValue = (stat as any).getDataValue('daysWorked');
      
      const totalTime = parseInt(String(totalTimeValue || '0')) || 0;
      const daysWorked = parseInt(String(daysWorkedValue || '1')) || 1;
      
      return {
        month: monthValue ? String(monthValue) : '',
        totalTime,
        averageDailyTime: totalTime / daysWorked
      };
    });
  }

  private async getTimePerTask(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const taskStats = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
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

  private async getProductivityHours(
    memberId: number,
    projectId: number,
    filters?: MemberProductivityFilters
  ) {
    const whereClause: any = {
      userId: memberId
    };

    if (filters?.dateRange) {
      whereClause.start_time = {
        [Op.between]: [
          new Date(filters.dateRange.startDate),
          new Date(filters.dateRange.endDate)
        ]
      };
    }

    const hourStats = await models.TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Task,
        as: 'task',
        where: { projectId },
        attributes: []
      }],
      attributes: [
        [fn('EXTRACT', literal('HOUR FROM start_time')), 'hour'],
        [fn('SUM', col('duration')), 'totalTime'],
        [fn('COUNT', col('TimeEntry.id')), 'sessions']
      ],
      group: [fn('EXTRACT', literal('HOUR FROM start_time'))],
      order: [[fn('EXTRACT', literal('HOUR FROM start_time')), 'ASC']]
    });

    return hourStats.map(stat => ({
      hour: parseInt(String((stat as any).getDataValue('hour') || '0')),
      totalTime: parseInt(String((stat as any).getDataValue('totalTime') || '0')),
      sessions: parseInt(String((stat as any).getDataValue('sessions') || '0'))
    }));
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
      
      console.log('Service: Getting productivity for member:', memberId, 'project:', projectId);
      
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

      console.log('Service: Found project member:', projectMember.user.fullName);

      // Get task performance metrics
      const taskPerformance = await this.getTaskPerformanceMetrics(memberId, projectId, filters);
      console.log('Service: Task performance calculated');

      // Get time tracking analytics
      const timeTracking = await this.getTimeTrackingAnalytics(memberId, projectId, filters);
      console.log('Service: Time tracking calculated');

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
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }
}

export default new MemberProductivityService(); 