import { PrismaClient } from '@prisma/client';
import type {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
  StopTimerDto,
  TimeEntryFiltersDto,
} from './time-tracking';

const prisma = new PrismaClient();

export class TimeTrackingService {
  // Time entry CRUD operations
  async create(data: CreateTimeEntryDto) {
    return await prisma.timeEntry.create({
      data: {
        userId: data.userId,
        taskId: data.taskId,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        note: data.note,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateTimeEntryDto) {
    return await prisma.timeEntry.update({
      where: { id },
      data,
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.timeEntry.delete({
      where: { id },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async get(id: string) {
    return await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async list(filters?: TimeEntryFiltersDto) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters?.projectId) {
      where.task = {
        projectId: filters.projectId,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  // Timer operations
  async startTimer(data: StartTimerDto) {
    // Check if user already has a running timer
    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: data.userId,
        endTime: null,
      },
    });

    if (runningTimer) {
      throw new Error('User already has a running timer');
    }

    return await prisma.timeEntry.create({
      data: {
        userId: data.userId,
        taskId: data.taskId,
        startTime: new Date(),
        note: data.note,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async stopTimer(userId: string, data?: StopTimerDto) {
    // Log before state
    const before = await prisma.timeEntry.findMany({
      where: { userId, endTime: null },
    });
    console.log('Before stopTimer, running timers:', before);
    console.log('stopTimer called for userId:', userId);

    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });
    console.log('Found runningTimer:', runningTimer);

    if (!runningTimer) {
      console.log('No running timer found for user:', userId);
      throw new Error('No running timer found for user');
    }

    const endTime = data?.endTime ?? new Date();
    const duration = Math.floor(
      (endTime.getTime() - runningTimer.startTime.getTime()) / 1000
    );
    console.log('Computed endTime:', endTime, 'duration:', duration);

    const updated = await prisma.timeEntry.update({
      where: { id: runningTimer.id },
      data: {
        endTime,
        duration,
        note: data?.note ?? runningTimer.note,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    console.log('Updated timeEntry:', updated);

    // Log after state
    const after = await prisma.timeEntry.findMany({
      where: { userId, endTime: null },
    });
    console.log('After stopTimer, running timers:', after);

    return updated;
  }

  async getTimerStatus(userId: string) {
    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Calculate total time for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        endTime: {
          not: null,
        },
      },
    });

    const totalToday = todayEntries.reduce((sum, entry) => {
      return sum + (entry.duration ?? 0);
    }, 0);

    return {
      isRunning: !!runningTimer,
      currentEntry: runningTimer ?? undefined,
      totalToday,
      totalTodayHours: Math.round((totalToday / 3600) * 100) / 100,
    };
  }

  // Reporting and analytics
  async generateReport(filters?: TimeEntryFiltersDto) {
    const entries = await this.list(filters);

    const totalTime = entries.reduce((sum, entry) => {
      return sum + (entry.duration ?? 0);
    }, 0);

    const totalHours = Math.round((totalTime / 3600) * 100) / 100;
    const totalDays = Math.round((totalHours / 8) * 100) / 100;

    // Group by task
    const byTask = entries.reduce<any[]>((acc, entry) => {
      const taskId = entry.taskId;
      const existing = acc.find((item) => item.taskId === taskId);

      if (existing) {
        existing.time += entry.duration ?? 0;
        existing.hours = Math.round((existing.time / 3600) * 100) / 100;
      } else {
        acc.push({
          taskId,
          taskTitle: entry.task?.title ?? 'Unknown Task',
          time: entry.duration ?? 0,
          hours: Math.round(((entry.duration ?? 0) / 3600) * 100) / 100,
        });
      }

      return acc;
    }, []);

    // Group by user
    const byUser = entries.reduce<any[]>((acc, entry) => {
      const userId = entry.userId;
      const existing = acc.find((item) => item.userId === userId);

      if (existing) {
        existing.time += entry.duration ?? 0;
        existing.hours = Math.round((existing.time / 3600) * 100) / 100;
      } else {
        acc.push({
          userId,
          userName: `${entry.user?.firstName ?? ''} ${
            entry.user?.lastName ?? ''
          }`,
          time: entry.duration ?? 0,
          hours: Math.round(((entry.duration ?? 0) / 3600) * 100) / 100,
        });
      }

      return acc;
    }, []);

    // Group by date
    const byDate = entries.reduce<any[]>((acc, entry) => {
      const date = entry.startTime.toISOString().split('T')[0];
      const existing = acc.find((item) => item.date === date);

      if (existing) {
        existing.time += entry.duration ?? 0;
        existing.hours = Math.round((existing.time / 3600) * 100) / 100;
      } else {
        acc.push({
          date,
          time: entry.duration ?? 0,
          hours: Math.round(((entry.duration ?? 0) / 3600) * 100) / 100,
        });
      }

      return acc;
    }, []);

    return {
      totalTime,
      totalHours,
      totalDays,
      entries,
      summary: {
        byTask,
        byUser,
        byDate,
      },
    };
  }

  async getTimeStats(userId?: string, taskId?: string, projectId?: string) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (projectId) {
      where.task = {
        projectId,
      };
    }

    const baseWhere = { ...where, endTime: { not: null } };

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      prisma.timeEntry.aggregate({
        _sum: { duration: true },
        where: baseWhere,
      }),
      prisma.timeEntry.aggregate({
        _sum: { duration: true },
        where: {
          ...baseWhere,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.timeEntry.aggregate({
        _sum: { duration: true },
        where: {
          ...baseWhere,
          startTime: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      prisma.timeEntry.aggregate({
        _sum: { duration: true },
        where: {
          ...baseWhere,
          startTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total: total._sum.duration ?? 0,
      today: today._sum.duration ?? 0,
      thisWeek: thisWeek._sum.duration ?? 0,
      thisMonth: thisMonth._sum.duration ?? 0,
    };
  }

  async getTeamProductivityTrend(
    teamIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    // 1. Get all users for each team
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { teamId: true, userId: true },
    });

    // 2. Group userIds by teamId
    const teamUserMap: Record<string, string[]> = {};
    for (const { teamId, userId } of teamMembers) {
      if (!teamUserMap[teamId]) teamUserMap[teamId] = [];
      teamUserMap[teamId].push(userId);
    }

    // 3. For each team, get time entries for users in date range, group by day
    const results: Record<
      string,
      Array<{ date: string; totalSeconds: number }>
    > = {};
    for (const teamId of teamIds) {
      const userIds = teamUserMap[teamId] ?? [];
      if (userIds.length === 0) {
        results[teamId] = [];
        continue;
      }
      const entries = await prisma.timeEntry.findMany({
        where: {
          userId: { in: userIds },
          startTime: { gte: startDate, lte: endDate },
          endTime: { not: null },
        },
      });

      // Group by date
      const byDate: Record<string, number> = {};
      for (const entry of entries) {
        const date = entry.startTime.toISOString().split('T')[0];
        byDate[date] = (byDate[date] ?? 0) + (entry.duration ?? 0);
      }
      results[teamId] = Object.entries(byDate).map(([date, totalSeconds]) => ({
        date,
        totalSeconds,
      }));
    }

    return results;
  }

  async getTeamActivityHeatmap(teamId: string, startDate: Date, endDate: Date) {
    // 1. Get all userIds in the team
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });
    const userIds = teamMembers.map((m) => m.userId);

    // 2. Get all time entries for those users in the date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: startDate, lte: endDate },
        endTime: { not: null },
      },
    });

    // 3. Aggregate by day of week and hour of day
    const heatmap: number[][] = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));
    for (const entry of entries) {
      const date = new Date(entry.startTime);
      const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const hour = date.getHours(); // 0-23
      heatmap[day][hour] += entry.duration ?? 0; // sum durations
    }
    return heatmap;
  }
}
