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

    public async getUserTimerStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const status = await timeTrackingService.getTimerStatus(userId);
            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}

export default new TimeTrackingController(); 