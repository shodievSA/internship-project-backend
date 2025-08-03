import { Request, Response, NextFunction } from 'express';
import timeTrackingService from '../services/timeTrackingService';
import AuthenticatedRequest from '../types/authenticatedRequest';

class TimeTrackingController {
    public async startTimer(req: Request, res: Response, next: NextFunction) {
        try {
            const { taskId, note } = req.body;
            const userId = (req as AuthenticatedRequest).user.id;
            const timeEntry = await timeTrackingService.startTimer(userId, taskId, note);
            res.status(201).json(timeEntry);
        } catch (error) {
            next(error);
        }
    }

    public async stopTimer(req: Request, res: Response, next: NextFunction) {
        try {
            const { note } = req.body;
            const userId = (req as AuthenticatedRequest).user.id;
            const timeEntry = await timeTrackingService.stopTimer(userId, note);
            res.json(timeEntry);
        } catch (error) {
            next(error);
        }
    }

    public async getTimerStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as AuthenticatedRequest).user.id;
            const status = await timeTrackingService.getTimerStatus(userId);
            res.json(status);
        } catch (error) {
            next(error);
        }
    }

    public async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as AuthenticatedRequest).user.id;
            const taskId = req.query.taskId ? parseInt(req.query.taskId as string, 10) : undefined;
            const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
            const stats = await timeTrackingService.getStats(userId, taskId, projectId);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    public async createManualEntry(req: Request, res: Response, next: NextFunction) {
        try {
            const { taskId, startTime, endTime, note } = req.body;
            const userId = (req as AuthenticatedRequest).user.id;

            // Validate required fields
            if (!taskId || !startTime || !endTime) {
                return res.status(400).json({
                    message: 'taskId, startTime, and endTime are required'
                });
            }

            // Parse dates
            const parsedStartTime = new Date(startTime);
            const parsedEndTime = new Date(endTime);

            // Validate date parsing
            if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
                return res.status(400).json({
                    message: 'Invalid date format for startTime or endTime'
                });
            }

            const timeEntry = await timeTrackingService.createManualEntry(
                userId,
                taskId,
                parsedStartTime,
                parsedEndTime,
                note
            );

            res.status(201).json(timeEntry);
        } catch (error) {
            next(error);
        }
    }

    public async updateManualEntry(req: Request, res: Response, next: NextFunction) {
        try {
            const { taskId, startTime, endTime, note } = req.body;
            const userId = (req as AuthenticatedRequest).user.id;
            const entryId = parseInt(req.params.entryId, 10);

            if (isNaN(entryId)) {
                return res.status(400).json({
                    message: 'Invalid entry ID'
                });
            }

            const updates: any = {};
            if (taskId !== undefined) updates.taskId = taskId;
            if (startTime !== undefined) {
                const parsedStartTime = new Date(startTime);
                if (isNaN(parsedStartTime.getTime())) {
                    return res.status(400).json({
                        message: 'Invalid date format for startTime'
                    });
                }
                updates.startTime = parsedStartTime;
            }
            if (endTime !== undefined) {
                const parsedEndTime = new Date(endTime);
                if (isNaN(parsedEndTime.getTime())) {
                    return res.status(400).json({
                        message: 'Invalid date format for endTime'
                    });
                }
                updates.endTime = parsedEndTime;
            }
            if (note !== undefined) updates.note = note;

            const timeEntry = await timeTrackingService.updateManualEntry(userId, entryId, updates);
            res.json(timeEntry);
        } catch (error) {
            next(error);
        }
    }

    public async deleteManualEntry(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as AuthenticatedRequest).user.id;
            const entryId = parseInt(req.params.entryId, 10);

            if (isNaN(entryId)) {
                return res.status(400).json({
                    message: 'Invalid entry ID'
                });
            }

            const result = await timeTrackingService.deleteManualEntry(userId, entryId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new TimeTrackingController(); 