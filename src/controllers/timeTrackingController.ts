import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '../types/authenticatedRequest';
import timeTrackingService from '../services/timeTrackingService';
import { AppError } from '@/types';

class TimeTrackingController {

    public async startTimer(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const { taskId, note } = req.body;
            const userId = req.user.id;
            const timeEntry = await timeTrackingService.startTimer(userId, taskId, note);

            res.status(201).json(timeEntry);

        } catch (err) {

            next(err);

        }

    }

    public async stopTimer(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const { note } = req.body;
            const userId = req.user.id;
            const timeEntry = await timeTrackingService.stopTimer(userId, note);

            res.status(200).json(timeEntry);

        } catch (err) {

            next(err);

        }

    }

    public async getTimerStatus(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const userId = req.user.id;
            const status = await timeTrackingService.getTimerStatus(userId);

            res.status(200).json(status);

        } catch (err) {

            next(err);

        }

    }

    public async getStats(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const userId = req.user.id;
            const taskId = req.query.taskId ? parseInt(req.query.taskId as string, 10) : undefined;
            const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;

            const stats = await timeTrackingService.getStats(userId, taskId, projectId);

            res.status(200).json(stats);

        } catch (err) {

            next(err);

        }

    }

    public async createManualEntry(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const { taskId, startTime, endTime, note } = req.body;
            const userId = req.user.id;

            if (!taskId || !startTime || !endTime) {

                throw new AppError("Task id, start time and end time are required", 400, true);

            }

            const parsedStartTime = new Date(startTime);
            const parsedEndTime = new Date(endTime);

            if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {

                throw new AppError("Invalid date format for start time or end time", 400, true);

            }

            const timeEntry = await timeTrackingService.createManualEntry(
                userId,
                taskId,
                parsedStartTime,
                parsedEndTime,
                note
            );

            res.status(201).json(timeEntry);

        } catch (err) {

            next(err);

        }

    }

    public async updateManualEntry(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const { taskId, startTime, endTime, note } = req.body;
            const userId = req.user.id;
            const entryId = parseInt(req.params.entryId, 10);

            if (isNaN(entryId)) throw new AppError("Invalid entry id", 400, true);

            const updates: any = {};

            if (taskId !== undefined) updates.taskId = taskId;

            if (startTime !== undefined) {

                const parsedStartTime = new Date(startTime);

                if (isNaN(parsedStartTime.getTime())) {

					throw new AppError("Invalid date format for start time", 400, true);

				}

                updates.startTime = parsedStartTime;

            }

            if (endTime !== undefined) {

                const parsedEndTime = new Date(endTime);

                if (isNaN(parsedEndTime.getTime())) {

					throw new AppError("Invalid date format for end time", 400, true);

				}

                updates.endTime = parsedEndTime;

            }

            if (note !== undefined) {

				updates.note = note;

			}

            const timeEntry = await timeTrackingService.updateManualEntry(userId, entryId, updates);

            res.status(200).json(timeEntry);

        } catch (err) {

            next(err);

        }

    }

    public async deleteManualEntry(
		req: AuthenticatedRequest, 
		res: Response, 
		next: NextFunction
	) {

        try {

            const userId = req.user.id;
            const entryId = parseInt(req.params.entryId, 10);

            if (isNaN(entryId)) throw new AppError("Invalid entry id", 400, true);

            const result = await timeTrackingService.deleteManualEntry(userId, entryId);

            res.status(200).json(result);

        } catch (err) {

            next(err);

        }

    }

}

export default new TimeTrackingController(); 