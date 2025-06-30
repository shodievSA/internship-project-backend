import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { FormattedProject, ProjectDetails } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import { transporter } from '@/config/email';
import Task from '@/models/task';

async function leaveProject(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	
	try {

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

		const userId: number = req.user.id;
		const project = await projectService.createProject(userId, title, userPosition);

		res.status(201).json({ project });

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

			const { Invites, fullProdInvite} = await projectService.inviteToProject(
				projectId, receiverEmail, positionOffered, roleOffered
			);

			const email = await transporter.sendMail({
						
				to: receiverEmail,
				from: process.env.EMAIL,
				subject: '📬 Project invitation',
				html: `
					<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
					<h1 style="color: #007BFF;">You've been invited to a project!</h1>

					<h2 style="color: #333; font-size: 22px; margin-top: 20px;">
						${fullProdInvite?.project?.title}
					</h2>

					<p style="font-size: 16px;">
						<strong>Role:</strong> ${roleOffered}<br>
						<strong>Position:</strong> ${positionOffered}
					</p>

					<a href="${process.env.FRONTEND_URL}/projects" style="
						display: inline-block;
						margin-top: 20px;
						padding: 10px 20px;
						background-color: #007BFF;
						color: white;
						text-decoration: none;
						border-radius: 5px;
						font-weight: bold;
					">
						Accept Invitation
					</a>

					</div>
				`

			});

			res.status(201).json({ message: 'Project invitation sent successfully', Invites, email });

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

			res.status(200).json({ message: 'Project invitation status changed successfully', invitationStatus});
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

		const updatedFields: Partial<{ title: string; status: Status }> = {title, status};

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

		if (!projectId || !memberId) {
			res.status(400).json({ error: 'Project ID and Member ID are required' });
			return;
		}

		if (!newRole) {
			res.status(400).json({ error: 'New role does not exist' });
			return;
		}

		const updatedTeamMemberRole = await projectService.updateTeamMemberRole(projectId, memberId, newRole);

		res.status(200).json({ message: 'Team member role updated successfully', updatedTeamMemberRole });

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

	if (!req.memberPermissions?.includes('kickOutTeamMembers')) {

		res.sendStatus(403);

	} else {

		try {

			await projectService.removeTeamMember(projectId, memberId);
			res.status(200).json({ message: 'User removed from the project successfully' });

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

		res.status(200).json({ projectDetails: projectDetails});

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

		res.sendStatus(204);

	} catch (error) {

		next(error)

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
	inviteToProject,
	invitationStatus,
	updateProject,
	changeTeamMemberRole,
	removeTeamMember,
	getProjects,
	getProjectDetails,
	deleteProject,
    createTask,
};

export default projectController;