import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { AppError } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';

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

async function updateInviteStatus(
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

			const inviteInfo = await projectService.updateInviteStatus(inviteStatus, inviteId);

			res.status(200).json({ 
				message: 'Project invitation status changed successfully', 
				inviteInfo: inviteInfo 
			});

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

const teamMemberController = {
	inviteToProject,
	updateInviteStatus,
	changeTeamMemberRole,
	removeTeamMember,
	getMemberProductivity,
	getProjectInvites,
	getTeamOfProject,
};

export default teamMemberController;
