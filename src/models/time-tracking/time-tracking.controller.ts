import { type Request, type Response, type NextFunction } from 'express';
import { TimeTrackingService } from './time-tracking.service';

export class TimeTrackingController {
  private readonly service = new TimeTrackingService();

  // Time entry CRUD operations
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const timeEntry = await this.service.create(req.body);
      res.status(201).json(timeEntry);
    } catch (e) {
      console.error('Error in create:', e.stack || e);
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const timeEntry = await this.service.update(req.params.id, req.body);
      res.json(timeEntry);
    } catch (e) {
      console.error('Error in update:', e.stack || e);
      next(e);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error('Error in delete:', e.stack || e);
      next(e);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const timeEntry = await this.service.get(req.params.id);
      if (!timeEntry)
        return res.status(404).json({ message: 'Time entry not found' });
      res.json(timeEntry);
    } catch (e) {
      console.error('Error in get:', e.stack || e);
      next(e);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        userId: req.query.userId as string,
        taskId: req.query.taskId as string,
        projectId: req.query.projectId as string,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };
      const timeEntries = await this.service.list(filters);
      res.json(timeEntries);
    } catch (e) {
      console.error('Error in list:', e.stack || e);
      next(e);
    }
  }

  // Timer operations
  async startTimer(req: Request, res: Response, next: NextFunction) {
    try {
      const timeEntry = await this.service.startTimer(req.body);
      res.status(201).json(timeEntry);
    } catch (e) {
      console.error('Error in startTimer:', e.stack || e);
      next(e);
    }
  }

  async stopTimer(req: Request, res: Response, next: NextFunction) {
    try {
      const timeEntry = await this.service.stopTimer(
        req.params.userId,
        req.body
      );
      res.json(timeEntry);
    } catch (e) {
      console.error('Error in stopTimer:', e.stack || e);
      next(e);
    }
  }

  async getTimerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await this.service.getTimerStatus(req.params.userId);
      res.json(status);
    } catch (e) {
      console.error('Error in getTimerStatus:', e.stack || e);
      next(e);
    }
  }

  // Reporting and analytics
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        userId: req.query.userId as string,
        taskId: req.query.taskId as string,
        projectId: req.query.projectId as string,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };
      const report = await this.service.generateReport(filters);
      res.json(report);
    } catch (e) {
      console.error('Error in generateReport:', e.stack || e);
      next(e);
    }
  }

  async getTimeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.userId as string;
      const taskId = req.query.taskId as string;
      const projectId = req.query.projectId as string;

      const stats = await this.service.getTimeStats(userId, taskId, projectId);
      res.json(stats);
    } catch (e) {
      console.error('Error in getTimeStats:', e.stack || e);
      next(e);
    }
  }

  // Manual time entry
  async createManualEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, taskId, startTime, endTime, duration, note } = req.body;

      if (!startTime || (!endTime && !duration)) {
        return res.status(400).json({
          message: 'Start time and either end time or duration are required',
        });
      }

      const timeEntry = await this.service.create({
        userId,
        taskId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
        note,
      });

      res.status(201).json(timeEntry);
    } catch (e) {
      console.error('Error in createManualEntry:', e.stack || e);
      next(e);
    }
  }

  // User-specific time tracking
  async getUserTimeEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        userId: req.params.userId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };
      const timeEntries = await this.service.list(filters);
      res.json(timeEntries);
    } catch (e) {
      console.error('Error in getUserTimeEntries:', e.stack || e);
      next(e);
    }
  }

  async getTaskTimeEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        taskId: req.params.taskId,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };
      const timeEntries = await this.service.list(filters);
      res.json(timeEntries);
    } catch (e) {
      console.error('Error in getTaskTimeEntries:', e.stack || e);
      next(e);
    }
  }

  async teamProductivityTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const teamIds = (req.query.teamIds as string).split(',');
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const data = await this.service.getTeamProductivityTrend(
        teamIds,
        startDate,
        endDate
      );
      res.json(data);
    } catch (e) {
      console.error('Error in teamProductivityTrend:', e.stack || e);
      next(e);
    }
  }

  async teamActivityHeatmap(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.query.teamId as string;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const data = await this.service.getTeamActivityHeatmap(
        teamId,
        startDate,
        endDate
      );
      res.json(data);
    } catch (e) {
      console.error('Error in teamActivityHeatmap:', e.stack || e);
      next(e);
    }
  }
}
