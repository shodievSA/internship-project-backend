import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import teamMemberService from '../services/teamMemberService';
import { AppError, FormattedProject, ProjectDetails } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';

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

			await teamMemberService.leaveProject(projectId, userId);

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





const projectController = {
	leaveProject,
	createProject,
	updateProject,
	getProjects,
	getProjectDetails,
	deleteProject,
};

export default projectController;