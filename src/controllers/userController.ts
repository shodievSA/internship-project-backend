import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';


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

      const updatedTitle: string = req.body.title?.trim();
      const updatedStatus: 'active' | 'paused' | 'completed' = req.body.status.trim();

      const updatedFields: Partial<{ title: string, status: 'active' | 'paused' | 'completed' }> = {};

      if (updatedTitle) updatedFields.title = updatedTitle;
      if (updatedStatus && ['active', 'paused', 'completed'].includes(updatedStatus)) updatedFields.status = updatedStatus;

      if (Object.keys(updatedFields).length === 0) {
        throw new Error("No fields to update");
      } else {
        const updatedProject = await userService.updateProject(projectId, updatedFields);

        res.status(200).json({ message: 'Project updated successfully', updatedProject });
      }
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();