import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { FormattedProject, ProjectDetails } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import Task, { TaskAttributes } from '@/models/task';

async function leaveProject(
	req: AuthenticatedRequest, 
	res:Response, 
	next: NextFunction
) {
	
	const projectId: number = parseInt(req.params.projectId);
	const userId: number = req.user.id;

	if (req.memberPermissions?.includes('leaveProject')) {

		try {

			await projectService.leaveProject(projectId, userId);
			res.status(200).json({ message: 'User left project' });

		} catch (error) {

			return next(error);

		}

	} else {

		res.sendStatus(403);
		
	}

}

async function createProject(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	const { title, userPosition } = req.body as {
		title: string;
		userPosition: string;
	};

	try {

		const userId: number = req.user.id;
		const project = await projectService.createProject(userId, title, userPosition);

		res.status(201).json({ project });

	} catch (error) {

		next(error);

	}

}

async function updateProject(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const projectId: number = parseInt(req.params.projectId);
		const updatedProjectProps = req.body.updatedProjectProps;

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
	
		const updatedProject = await projectService.updateProject(projectId, updatedFields);
	
		res.status(200).json({ message: 'Project updated successfully', updatedProject });

	} catch (error) {

		return next(error);

	}
	
}

async function changeTeamMemberRole(
	req: AuthenticatedRequest, 
	res:Response, 
	next: NextFunction
): Promise<void> {

	try {

		const projectId: number = parseInt(req.params.projectId);
		const memberId: number = parseInt(req.params.memberId);
		const newRole = req.body.newRole;

		if (!projectId || !memberId) {
			res.status(400).json({ error: 'Project ID and Member ID are required' });
			return;
		}

		if (!newRole) {
			res.status(400).json({ error: 'New role does not exist' });
			return;
		}

		const updatedTeamMemberRole = await projectService.updateTeamMemberRole(projectId, memberId, newRole);

		res.status(200).json({ message: 'Team member role updated successfully', updatedTeamMemberRole});

	} catch (error) {

		return next(error);

	}

}

async function removeTeamMember(
	req: AuthenticatedRequest, 
	res:Response, 
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);
	const memberId: number = parseInt(req.params.memberId);

	if (!req.memberPermissions?.includes('kickOutTeamMembers')) {

		res.sendStatus(403);

	} else {

		try {

			await projectService.removeTeamMember(projectId, memberId);
			res.status(200).json({ message: 'User removed from the project successfully' });

		} catch (error) {

			return next(error);

		}

	}

}

async function getProjects(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const userId: number = req.user.id;
		const projects: FormattedProject[] = await projectService.getProjects(userId);

		res.status(200).json({ projects: projects });

	} catch (error) {

		next(error);

	}

}

async function getProjectDetails(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const userId: any = req.user.id;
		const projectId = parseInt(req.params.projectId, 10) || req.body.projectId;
		const projectDetails: ProjectDetails = await projectService.getProjectDetails(
			userId,
			projectId
		);

		res.status(200).json({ projectDetails: projectDetails });

	} catch (error) {

		next(error);

	}

}

async function deleteProject(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);

	try {

		await projectService.deleteProject(projectId);

		res.sendStatus(201);

	} catch (error) {

		console.error('Error deleting the project:', error);
		throw new Error('Internal server error');

	}

}

async function createTask( 
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
): Promise<any> {

    const task = req.body.task;
    task.projectId = parseInt(req.params.projectId);
    task.assignedBy = req.user.id

        try { 
            if ( req.memberPermissions?.includes('assignTasks') ) { 

                const nTask = await projectService.createTask(task as Task)

                return res.status(201).json(nTask)
            }

            return res.status(403).json({ message: 'Permission required'})
        }

        catch (error) { 

            next(error)

        }
    }

const projectController = {
	leaveProject,
	createProject,
	updateProject,
	changeTeamMemberRole,
	removeTeamMember,
	getProjects,
	getProjectDetails,
	deleteProject,
    createTask,
};

export default projectController;