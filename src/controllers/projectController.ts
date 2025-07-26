import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { AppError, FormattedProject, FrontSprintAttributes, ProjectDetails } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import { TaskAttributes } from '@/models/task';
import { hasOnlyKeysOfB } from '@/middlewares/isCorrectKeys';
import { models } from '@/models';

async function leaveProject(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {

	try {

		const projectId: number = parseInt(req.params.projectId);
		const userId: number = req.user.id;

		if (!req.memberPermissions?.includes("leaveProject")) {

			throw new AppError("As admin, you can't leave your own project", 403);

		}

		try {

			await projectService.leaveProject(projectId, userId);

			res.sendStatus(204);

		} catch (err) {

			console.log(
				"The following error occurred in leaveProject function: " + (err as Error).message
			);

			throw new AppError(
				"Unexpected error occurred on our side while trying to make you leave the project. Please, try again later."
			);

		}

	} catch (error) {

		next(error);

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

		try {

			const userId: number = req.user.id;
			const project = await projectService.createProject(userId, title, userPosition);

			res.status(201).json({ project });

		} catch (err) {

			console.error(
				"Error occurred in createProject function: " + (err as AppError).message
			);

			throw new AppError(
				`Unexpected error occurred ${err} . Please, try again later.`
			);
			
		}

	} catch (error) {

		next(error);

	}

}

async function inviteToProject(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const { receiverEmail, positionOffered, roleOffered } = req.body as {
		receiverEmail: string,
		positionOffered: string,
		roleOffered: 'manager' | 'member',
	};

	const projectId: number = parseInt(req.params.projectId);

	try {

		if (!receiverEmail || !positionOffered || !roleOffered) {

			res.status(400).json({
				error: 'receiverEmail, positionOffered, and roleOffered are required',
			});

			return;

		}

		if (!projectId) {
			res.status(400).json({
				error: 'projectId is missing',
			});

			return;
		}

		if (req.memberPermissions?.includes('invitePeople')) {

			const { invite } = await projectService.inviteToProject(
				req.user.id, projectId, receiverEmail, positionOffered, roleOffered
			);

			res.status(201).json({
				message: 'Project invitation sent successfully',
				invite: invite,
			});

		} else {

			res.sendStatus(403);

		}


	} catch (error) {

		next(error);

	}

}

async function invitationStatus(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const inviteStatus: 'accepted' | 'rejected' = req.body.status;
	const inviteId: number = parseInt(req.params.inviteId);

	try {

		if (!inviteStatus) {

			res.status(400).json({
				error: 'inviteStatus is missing'
			});

			return;

		} else if (!inviteId) {

			res.status(400).json({
				error: 'inviteId is missing'
			});

			return;

		} else {
			const invitationStatus = await projectService.invitationStatus(inviteStatus, inviteId);

			res.status(200).json({ message: 'Project invitation status changed successfully', invitationStatus });
		}

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

		const allowedStatuses = ['active', 'paused', 'completed'] as const;
		type Status = typeof allowedStatuses[number];

		const title = updatedProjectProps.title;
		const status = updatedProjectProps.status;

		const updatedFields: Partial<{ title: string; status: Status }> = { title, status };

		if (Object.keys(updatedFields).length === 0) {

			res.status(400).json({ error: 'No valid fields provided for update' });
			return;

		}

		if (req.memberPermissions?.includes('editProject')) {

			const updatedProject = await projectService.updateProject(projectId, updatedFields);
			res.status(200).json({ message: 'Project updated successfully', updatedProject });

		} else {

			res.sendStatus(403);

		}

	} catch (error) {

		next(error);

	}

}

async function changeTeamMemberRole(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const projectId: number = parseInt(req.params.projectId);
		const memberId: number = parseInt(req.params.memberId);
		const newRole = req.body.newRole;
        
        if (!req.memberPermissions?.includes('promoteMembers') || !req.memberPermissions?.includes("demoteMembers")) {

            throw new AppError(`No permission to assign member <${newRole}> role`);
        }

        if (!projectId || !memberId) {
            res.status(400).json({ error: 'Project ID and Member ID are required' });
            return;
        }

		if (!newRole) {
			res.status(400).json({ error: 'New role does not exist' });
			return;
		}

		const updatedTeamMember = await projectService.updateTeamMemberRole(projectId, memberId, newRole);

		res.status(200).json({ updatedTeamMember });


	} catch (error) {

		next(error);

	}

}

async function changeTaskStatus(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const taskId: number = parseInt(req.params.taskId);
	const projectId: number = parseInt(req.params.projectId);
	
	const { updatedTaskStatus, comment }: {
		updatedTaskStatus: 'under review' | 'rejected' | 'closed';
		comment: string;
	} = req.body;

	const fullname = req.user.fullName as string;

	if (!taskId) {

		res.status(400).json({ error: 'Task Id is missing' });
		return;

	}

	if (!updatedTaskStatus) {

		res.status(400).json({ error: 'Missing updatedTaskStatus' });
		return;

	}

	try {

		const updatedTask = await projectService.changeTaskStatus(projectId, taskId, updatedTaskStatus, comment, fullname);
		res.status(200).json({ message: 'Task status changed successfully', updatedTask });

	} catch (error) {

		next(error);

	}

}

async function removeTeamMember(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);
	const memberId: number = parseInt(req.params.memberId);
	const userId: number = req.user.id;

	if (!req.memberPermissions?.includes('kickOutTeamMembers')) { // issue

		throw new AppError("You do not have rights to remove team member")

	} else {

		try {

			await projectService.removeTeamMember(projectId, memberId, userId);

			res.sendStatus(204);

		} catch (error) {

			next(error);

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

        if(req.memberPermissions?.includes('deleteProject')){
            
            await projectService.deleteProject(projectId);
    
            res.sendStatus(204);
            return
        } else { 
            
            throw new AppError("No required permission");
        }

	} catch (error) {

		next(error);

	}

}

async function createTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<any> {

	const task: {

		title: string;
		description: string;
		priority: string;
		deadline: string;
		assignedTo: number;
		assignedBy: number;
		projectId: number;
		sprintId: number;

	} = {

		title: req.body.title,
		description: req.body.description,
		priority: req.body.priority,
		deadline: req.body.deadline,
		assignedTo: Number(req.body.assignedTo),
		assignedBy: Number(req.body.assignedBy),
		projectId: Number(req.body.projectId),
		sprintId: Number(req.body.sprintId)

	};

	const projectId: number = parseInt(req.params.projectId);
	const userId = req.user.id;

	const files = req.files as Express.Multer.File[] ?? [];
	const sizes: number[] = files.map(file => file.size);
	const fileNames: string[] = files.map((file) => file.originalname);

	try { 
		
        if (!hasOnlyKeysOfB(task, models.Task)) { 
            throw new AppError('Invalid fields in request body');
        }

		if (req.memberPermissions?.includes('assignTasks')) { 

			const newTask = await projectService.createTask(
				task, userId, projectId, fileNames, sizes, files
			);
			return res.status(201).json({ newTask });

		}

		return res.status(403).json({ message: 'Permission required' });

	} catch (error) {

		next(error);

    }
}

async function deleteTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	try {
		const projectId = parseInt(req.params.projectId)
		const taskId = parseInt(req.params.taskId)

		if (req.memberPermissions?.includes('deleteTasks')) {

			await projectService.deleteTask(req.user.id, projectId, taskId)
			res.sendStatus(204)
			return
		}
		throw new AppError('No permission', 403)
	}
	catch (error) {

		next(error);
	}
}

async function updateTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {

	const projectId = parseInt(req.params.projectId);
	const taskId = parseInt(req.params.taskId);

	const files = req.files as Express.Multer.File[] ?? [];
	const sizes: number[] = files.map(file => file.size);
	const fileNames: string[] = files.map((file) => file.originalname);

	const updatedTaskProps = req.body.updatedTaskProps;

	if (!updateProject || !projectId || !taskId) {
		throw new AppError('Empty input');
	}

	if (!hasOnlyKeysOfB(updatedTaskProps, models.Task)) {
		throw new AppError('Invalid fields forbidden');
	}

	try {

		if (req.memberPermissions?.includes('editTasks')) {

			const result = await projectService.updateTask(
				projectId, taskId, files, sizes, fileNames, updatedTaskProps
			);
			return res.status(200).json({ updatedTask: result });

		} else {

			throw new AppError('No permission to edit task');

		}

	} catch(error) { 

		next (error);

	}

}

async function getMemberProductivity(
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
) {

    const projectId = parseInt(req.params.projectId)
    const memberId = parseInt(req.params.memberId)

    if (!projectId || !memberId) { 
        throw new AppError('Empty input')
    }

    try {

        if ( req.memberPermissions?.includes('viewMemberProductivity')){
    
            const result = await projectService.getMemberProductivity(projectId, memberId);
            return res.status(200).json({productivityData: result})
        }
        else{
            throw new AppError('No permission to edit task')
        }

	} catch(error) { 
    	next (error);
	}
}

async function getTaskFiles(
	req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
) {

	try {

		const taskId: number = parseInt(req.params.taskId);

		if (!taskId ) throw new AppError('taskId is missing');

		const fileAttachments = await projectService.getTaskFiles(taskId);

		return res.status(200).json({ fileURLs: fileAttachments });
	
	} catch (error) {
		next (error);
	}
	
}

async function getProjectInvites(
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
) {
    
    const projectId = parseInt(req.params.projectId);

    if (!projectId) throw new AppError('Empty input');
    
    try {

        if ( req.memberPermissions?.includes('getProjectInvites')) {
    
            const invites = await projectService.getProjectInvites(projectId);
            return res.status(200).json({ projectInvites: invites });

        } else {
            
            throw new AppError('No permission to edit task');

        }

    } catch(error) { 

    	next (error);

    }

}

async function getTeamOfProject(
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction  
) {
    
    const projectId = parseInt(req.params.projectId);
	const userId = req.user.id;

    if (!projectId) throw new AppError('Empty input');

    try {
        
        const team = await projectService.getTeamOfProject(projectId);
        return res.status(200).json({ team: team });

    } catch(error) { 
	
		next(error);

    }

}

async function createSprint(
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction  
) {
    const projectId = parseInt(req.params.projectId);
    const sprintInfo = req.body.sprint;

    if (!projectId) throw new AppError('Empty input');
    
    if (!hasOnlyKeysOfB(sprintInfo, models.Sprint)) { 
        throw new AppError('Invalid fields in request body');
    }

    try {

        if (req.memberPermissions?.includes('assignTasks')) {

            const sprint = await projectService.createSprint(projectId, sprintInfo as FrontSprintAttributes);
            return res.status(200).json({ newSprint: sprint });

        }

    	throw new AppError('No permission');

    } catch(error) { 

    	next (error);

    }

}

async function getSprintsTasks(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const projectId = parseInt(req.params.projectId);
        const sprintId = parseInt(req.params.sprintId);

        if (!projectId || !sprintId) { 
            throw new AppError('Empty input')
        }
		const tasks = await projectService.getSprintsTasks( projectId, sprintId );

		res.status(200).json({ sprintTasks: tasks });

	} catch (error) {

		next(error);

	}

}

async function updateSprint(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const projectId: number = parseInt(req.params.projectId);
        const sprintId: number = parseInt(req.params.sprintId);
		const updatedSprintProps = req.body.updatedSprintProps;

		const allowedStatuses = ['planned', 'active', 'closed', 'overdue'] as const;
		type Status = typeof allowedStatuses[number];

		const title = updatedSprintProps.title;
        const description = updatedSprintProps.description
		const status = updatedSprintProps.status;
        let startDate: Date | undefined= undefined;
        let endDate: Date | undefined = undefined;

        if (updatedSprintProps.startDate ) { 
            startDate = new Date(updatedSprintProps?.startDate);
        }
        
        if (updatedSprintProps.endDate ) { 
            endDate = new Date(updatedSprintProps?.endDate);
        }



		const updatedFields: Partial<{ 
            title: string;
            description:string;
            status: Status;
            startDate: Date | undefined;
            endDate: Date | undefined }> = { title, description, status, startDate, endDate };

		if (Object.keys(updatedFields).length === 0) {

			res.status(400).json({ error: 'No valid fields provided for update' });
			return;

		}

		if (req.memberPermissions?.includes('editProject')) {

			const updatedProject = await projectService.updateSprint(projectId, sprintId, updatedFields);
			res.status(200).json({ message: 'Project updated successfully', updatedProject });

		} else {

			res.sendStatus(403);

		}

	} catch (error) {

		next(error);

	}

}

async function deleteSprint(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);
    const sprintId: number = parseInt(req.params.sprintId);

	try {

        if(req.memberPermissions?.includes('deleteProject')){
            
            await projectService.deleteSprint(projectId, sprintId);
    
            res.sendStatus(204);
            return
        } else { 
            throw new AppError("No required permission");
        }

	} catch (error) {

		next(error);

	}

}



const projectController = {
	leaveProject,
	createProject,
	inviteToProject,
	invitationStatus,
	updateProject,
	changeTeamMemberRole,
	changeTaskStatus,
	removeTeamMember,
	getProjects,
	getProjectDetails,
	deleteProject,
    createTask,
    deleteTask,
    updateTask,
    getMemberProductivity,
    getProjectInvites,
    getTeamOfProject,
	getTaskFiles,
    createSprint,
    getSprintsTasks,
    updateSprint,
    deleteSprint,
};

export default projectController;