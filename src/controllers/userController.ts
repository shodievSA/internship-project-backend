import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';
import { PassThrough } from 'stream';
import { error } from 'console';


class UserController {
  public getMe(req: any, res: any, next: any) {
    if (!req.user) {
      return next(new Error('User not authenticated'));
    }
    return userService
      .getUserData(req.user!.id)
      .then((userData) => {
        return res.status(200).json({ user: userData });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }

  public createNewProject(req: any, res: any, next: any) {
    const userId = req.user!.id;
    const { title, userPosition } = req.body;
    return userService
      .createNewProject(userId, title, userPosition)
      .then((project) => {
        return res.status(201).json({ project: project });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }

  public getProjects(req: any, res: any, next: any) {
    return userService
      .getUserProjects(req.user.id)
      .then((projects: any) => {
        return res.status(200).json({ projects: projects });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }

  public ProjectDetails(req: any, res: any, next: any) {
    const projectId: number = req.body.projectId;
    return userService
      .getProjectTasks(req.user.id, projectId)
      .then((detail: any) => {
        return res.status(200).json(detail);
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }

  public async deleteProject(req: Request, res: Response, next: NextFunction) {
    const projectId: string = req.params.projectId;

    try {
      await userService.deleteProject(projectId);

      res.status(204).json({ message: 'Project deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId: string = req.params.projectId;
      const updatedProjectProps = req.body;
      if (!updatedProjectProps) {
        res.status(400).json({ error: 'Updated object does not exist' });
        return;
      }

      const allowedStatuses = ['active', 'paused', 'completed'] as const;
      type Status = typeof allowedStatuses[number];

      const allowedKeys = ['title', 'status'];
      const keys = Object.keys(updatedProjectProps);
      const isValidKeysOnly = keys.every((key) => allowedKeys.includes(key));
      if (!isValidKeysOnly) {
        res.status(400).json({ error: 'Only title and status fields are allowed for updates' });
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

      const updatedProject = await userService.updateProject(projectId, updatedFields);

      res.status(200).json({ message: 'Project updated successfully', updatedProject });
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();