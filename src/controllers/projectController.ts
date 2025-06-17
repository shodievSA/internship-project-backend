import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';

class ProjectController {

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
    
	public async deleteProject(req: Request, res: Response, next: NextFunction) {

		const projectId: string = req.params.projectId;

		console.log(req.memberPermissions);

		if (!req.memberPermissions?.includes('deleteProject')) {

			res.sendStatus(403);

		} else {

			try {
				await userService.deleteProject(projectId);
				res.status(204).json({ message: 'Project deleted successfully' });
			} catch (error) {
				console.error(error);
				return next(error);
			}

		}

	}
    
	public async changeTeamMemberRole(req: Request, res:Response, next: NextFunction) {

		try {

			const projectId: string = req.params.projectId;
			const memberId: string = req.params.memberId;
			const newRole = req.body.newRole;

			if (!projectId || !memberId) {
				res.status(400).json({ error: 'Project ID and Member ID are required' });
				return;
			}

			if (!newRole) {
				res.status(400).json({ error: 'New role does not exist' });
				return;
			}

			const updatedTeamMemberRole = await userService.updateTeamMemberRole(projectId, memberId, newRole);
			res.status(200).json({ message: 'Team member role updated successfully', updatedTeamMemberRole});

		} catch (error) {

			return next(error);

		}

	}
    
	public async removeTeamMember(req: Request, res:Response, next: NextFunction) {

		const projectId: string = req.params.projectId;
		const memberId: string = req.params.memberId;

		if (!req.memberPermissions?.includes('kickOutTeamMembers')) {

			res.sendStatus(403);

		} else {

			try {

				await userService.removeTeamMember(projectId, memberId);
				res.status(200).json({ message: 'User removed from the project successfully' });

			} catch (error) {

				return next(error);

			}

		}

	}
    
	public async leaveProject(req: Request, res:Response, next: NextFunction) {

		const projectId: string = req.params.projectId;
		const userId: number = ( req.user as { id: number } )?.id;

		if (req.memberPermissions?.includes('leaveProject')) {

			try {

				await userService.leaveProject(projectId, userId);
				res.status(200).json({ message: 'User left project' });

			} catch (error) {

				return next(error);

			}

		} else {
			res.sendStatus(403);
		}

	}
	
}

export default new ProjectController();