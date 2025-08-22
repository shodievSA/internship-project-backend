import { Op } from 'sequelize';
import TimeEntry from '../models/timeEntry';
import { AppError } from '../types/customError';
import { startOfDay } from 'date-fns';

class TimeTrackingService {
    public async startTimer(userId: number, taskId: number, note?: string) {
        const runningTimer = await TimeEntry.findOne({
            where: {
                userId,
                endTime: {
                    [Op.is]: null,
                },
            },
        });

        if (runningTimer) {
            throw new AppError('Timer already running', 409);
        }

        const timeEntry = await TimeEntry.create({
            userId,
            taskId,
            startTime: new Date(),
            note,
        });

        return timeEntry;
    }

    public async stopTimer(userId: number, note?: string) {
        const runningTimer = await TimeEntry.findOne({
            where: {
                userId,
                endTime: {
                    [Op.is]: null,
                },
            },
        });

        if (!runningTimer) {
            throw new AppError('No running timer found to stop', 404);
        }

        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - runningTimer.startTime.getTime()) / 1000); // in seconds

        await runningTimer.update({
            endTime,
            duration,
            note: note ?? runningTimer.note,
        });

        return runningTimer;
    }

    public async getTimerStatus(userId: number) {
        const runningTimer = await TimeEntry.findOne({
            where: {
                userId,
                endTime: { [Op.is]: null },
            },
            include: ['task']
        });

        const todayEntries = await TimeEntry.findAll({
            where: {
                userId,
                startTime: {
                    [Op.gte]: startOfDay(new Date()),
                },
                duration: {
                    [Op.not]: null
                }
            },
        });

        const totalTodaySeconds = todayEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
        const totalTodayHours = totalTodaySeconds / 3600;

        return {
            isRunning: !!runningTimer,
            currentEntry: runningTimer,
            totalToday: totalTodaySeconds,
            totalTodayHours: totalTodayHours
        };
    }

    public async getStats(userId: number, taskId?: number, projectId?: number) {
        const where: any = {
            userId,
            endTime: { [Op.not]: null },
        };
        if (taskId) where.taskId = taskId;
        // If projectId is provided, need to join Task model
        let projectWhere = {};
        if (projectId) projectWhere = { projectId };

        // Helper to get sum of durations
        const sumDurations = async (extraWhere: any = {}) => {
            const entries = await TimeEntry.findAll({
                where: { ...where, ...extraWhere },
                include: projectId ? [{ model: require('../models/task').default, as: 'task', where: projectWhere }] : [],
            });
            return entries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
        };

        // --- NEW: Fetch all time entries for the given filters ---
        const timeEntries = await TimeEntry.findAll({
            where,
            order: [['startTime', 'ASC']],
            attributes: ['id', 'startTime', 'endTime', 'duration', 'note', 'taskId'],
        });

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [total, todaySum, weekSum, monthSum] = await Promise.all([
            sumDurations(),
            sumDurations({ startTime: { [Op.gte]: startOfToday } }),
            sumDurations({ startTime: { [Op.gte]: startOfWeek } }),
            sumDurations({ startTime: { [Op.gte]: startOfMonth } }),
        ]);

        // --- Return both stats and entries ---
        return {
            total,
            today: todaySum,
            thisWeek: weekSum,
            thisMonth: monthSum,
            entries: timeEntries, // <-- NEW: array of time entry objects
        };
    }

    public async createManualEntry(userId: number, taskId: number, startTime: Date, endTime: Date, note?: string) {
        // Validate that endTime is after startTime
        if (endTime <= startTime) {
            throw new AppError('End time must be after start time', 400);
        }

        // Calculate duration in seconds
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

        // Create the manual time entry
        const timeEntry = await TimeEntry.create({
            userId,
            taskId,
            startTime,
            endTime,
            duration,
            note,
        });

        return timeEntry;
    }

    public async updateManualEntry(userId: number, entryId: number, updates: {
        taskId?: number;
        startTime?: Date;
        endTime?: Date;
        note?: string;
        duration?: number;
    }) {
        // Find the time entry and verify ownership
        const timeEntry = await TimeEntry.findOne({
            where: {
                id: entryId,
                userId,
                endTime: { [Op.not]: null }, // Only allow editing completed entries
            },
        });

        if (!timeEntry) {
            throw new AppError('Time entry not found or not editable', 404);
        }

        // If updating startTime or endTime, validate the new times
        if (updates.startTime || updates.endTime) {
            const newStartTime = updates.startTime || timeEntry.startTime;
            const newEndTime = updates.endTime || timeEntry.endTime;

            if (newEndTime && newEndTime <= newStartTime) {
                throw new AppError('End time must be after start time', 400);
            }

            // Calculate new duration
            if (newEndTime) {
                const newDuration = Math.round((newEndTime.getTime() - newStartTime.getTime()) / 1000);
                updates.duration = newDuration;
            }
        }

        // Update the time entry
        await timeEntry.update(updates);

        return timeEntry;
    }

    public async deleteManualEntry(userId: number, entryId: number) {
        // Find the time entry and verify ownership
        const timeEntry = await TimeEntry.findOne({
            where: {
                id: entryId,
                userId,
                endTime: { [Op.not]: null }, // Only allow deleting completed entries
            },
        });

        if (!timeEntry) {
            throw new AppError('Time entry not found or not deletable', 404);
        }

        // Delete the time entry
        await timeEntry.destroy();

        return { message: 'Time entry deleted successfully' };
    }
}

export default new TimeTrackingService();
