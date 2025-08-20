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
			throw new AppError("As admin, you can't leave your own project", 403, true);
		}

		await teamMemberService.leaveProject(projectId, userId);

		res.status(204).json({ message: "You have left the project successfully!" });

	} catch (err) {

		next(err);

	}

}

async function createProject(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	
	try {

		const { title, userPosition } = req.body as { title: string; userPosition: string; };
	
		if (!title || !userPosition) { 
			throw new AppError("title and position can not be empty", 400, true);
		}

		const userId: number = req.user.id;
		const project = await projectService.createProject(userId, title, userPosition);

		res.status(201).json({ message: "New project has been created successfully!", project: project });

	} catch (err) {

		next(err);

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
			throw new AppError("Invalid fields have been provided for project update", 400, true);
		}

		if (req.memberPermissions?.includes('editProject')) {

			const updatedProject = await projectService.updateProject(projectId, updatedFields);

			res.status(200).json({ message: "Project has been updated successfully", updatedProject });

		} else {

			throw new AppError("You don't have enough permissions to edit the project", 403, true);

		}

	} catch (err) {

		next(err);

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

		res.status(200).json({ projects });

	} catch (err) {

		next(err);

	}

}

async function getProjectDetails(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const userId: any = req.user.id;
		const projectId = parseInt(req.params.projectId);

		const projectDetails: ProjectDetails = await projectService.getProjectDetails(userId, projectId);

		res.status(200).json({ projectDetails: projectDetails });

	} catch (err) {

		next(err);

	}

}

async function deleteProject(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	
	try {

		if (!req.memberPermissions?.includes('deleteProject')) {

			throw new AppError("You don't have enough permissions to delete the project", 403, true);

        } else { 
            
			const projectId: number = parseInt(req.params.projectId);
            
            await projectService.deleteProject(projectId);
    
            res.status(204).json({ message: "The project has been deleted successfully"});

        }

	} catch (err) {

		next(err);

	}

}

async function sendProjectInvite(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('invitePeople')) {
			
			throw new AppError("You don't have enough permissions to send invites", 403, true);

		} else {

			const { receiverEmail, positionOffered, roleOffered } = req.body as {
				receiverEmail: string,
				positionOffered: string,
				roleOffered: 'manager' | 'member'
			};

			const projectId: number = parseInt(req.params.projectId);

			if (!receiverEmail || !positionOffered || !roleOffered) {
				throw new AppError("Receiver email, position and role are required for sending invite", 400, true);
			}

			if (!projectId) throw new AppError("Project id is missing", 400, true);

			const { invite } = await projectService.sendProjectInvite(
				req.user.id, projectId, receiverEmail, positionOffered, roleOffered
			);

			res.status(201).json({ message: "Project invite has been sent successfully", invite: invite });

		}

	} catch(err) {

		next(err);

	}

}

async function getProjectInvites(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {

	try {

		if (!req.memberPermissions?.includes('getProjectInvites')) {

			throw new AppError("You don't have enough permissions to view project invites", 403, true);

		} else {

			const projectId = parseInt(req.params.projectId);

    		if (!projectId) throw new AppError("Project id is missing", 400, true);

			const invites = await projectService.getProjectInvites(projectId);

			return res.status(200).json({ projectInvites: invites });

		}

	} catch(err) {

		next(err);

	}

}

async function getProjectTeam(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction  
) {

	try {

		const projectId = parseInt(req.params.projectId);

		if (!projectId) throw new AppError("Project id is missing", 400, true);

		const team = await projectService.getProjectTeam(projectId);

        return res.status(200).json({ team });

	} catch(err) {

		next(err);

	}

}

const projectController = {
	leaveProject,
	createProject,
	updateProject,
	getProjects,
	getProjectDetails,
	deleteProject,
	sendProjectInvite,
	getProjectInvites,
	getProjectTeam,
};

export default projectController;