import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';
import { CreateTaskBody, UserData, UserProject, ProjectDetails } from '@/types';

class UserController {
  public async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user) {
        const userId: number = (req.user as any)?.id;
        const userData: UserData | null = await userService.getUserData(userId);

        res.status(200).json({ user: userData });
      }
    } catch (error) {
      next(error);
    }
  }

  public async createNewProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { title, userPosition } = req.body as {
      title: string;
      userPosition: string;
    };
    try {
      const userId: number = (req.user as any)?.id;
      const project = await userService.createNewProject(
        userId,
        title,
        userPosition
      );
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  }

  public async getProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId: number = (req.user as any)?.id;
      const projects: UserProject[] = await userService.getUserProjects(userId);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  public async projectDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId: any = (req.user as any)?.id;
      const projectId =
        parseInt(req.params.projectId, 10) || req.body.projectId;
      const detail: ProjectDetails = await userService.getProjectTasks(
        userId,
        projectId
      );
      res.status(200).json(detail);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const projectId: string = req.params.projectId;

    try {
      await userService.deleteProject(projectId);

      res.status(204).json({ message: 'Project deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }

  public async updateProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const projectId: string = req.params.projectId;
      const updatedProjectProps = req.body;
      if (!updatedProjectProps) {
        res.status(400).json({ error: 'Updated object does not exist' });
        return;
      }

      const allowedStatuses = ['active', 'paused', 'completed'] as const;
      type Status = (typeof allowedStatuses)[number];

      const allowedKeys = ['title', 'status'];
      const keys = Object.keys(updatedProjectProps);
      const isValidKeysOnly = keys.every((key) => allowedKeys.includes(key));
      if (!isValidKeysOnly) {
        res.status(400).json({
          error: 'Only title and status fields are allowed for updates',
        });
        return;
      }

      const updatedFields: Partial<{ title: string; status: Status }> = {};

      if ('title' in updatedProjectProps) {
        const title = updatedProjectProps.title.trim();

        if (typeof title !== 'string') {
          res.status(400).json({ error: 'Title is undefined' });
          return;
        }

        updatedFields.title = title;
      }

      if ('status' in updatedProjectProps) {
        const status = updatedProjectProps.status;

        if (!allowedStatuses.includes(status)) {
          res.status(400).json({
            error: `Status must be one of: ${allowedStatuses.join(', ')}`,
          });
          return;
        }

        updatedFields.status = status;
      }

      if (Object.keys(updatedFields).length === 0) {
        res.status(400).json({ error: 'No valid fields provided for update' });
        return;
      }

      const updatedProject = await userService.updateProject(
        projectId,
        updatedFields
      );

      res
        .status(200)
        .json({ message: 'Project updated successfully', updatedProject });
    } catch (error) {
      return next(error);
    }
  }

  public async createTask(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const projectId: number = parseInt(req.params.projectId, 10);
    try {
      const body = req.body as CreateTaskBody;
      const userId: number = (req.user as any)?.id;
      const task = await userService.createTask(userId, projectId, body);
      res.status(200).json({ task });
      return;
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();
