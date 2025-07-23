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
}

export default new TimeTrackingService(); 