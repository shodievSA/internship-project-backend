import { Response, NextFunction } from 'express';
import teamMemberService from '../services/teamMemberService';
import { AppError } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';

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

		const updatedTeamMember = await teamMemberService.updateTeamMemberRole(projectId, memberId, newRole);

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

    if (!projectId) throw new AppError("Project ID is required");
    if (!memberId) throw new AppError("Member ID is required");
    if (!userId) throw new AppError("User id ID is required");

	if (!req.memberPermissions?.includes('kickOutTeamMembers')) { // issue

		throw new AppError("You do not have rights to remove team member")

	} else {

		try {

			await teamMemberService.removeTeamMember(projectId, memberId, userId);

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
): Promise<void> {

    const projectId = parseInt(req.params.projectId)
    const memberId = parseInt(req.params.memberId)

    if (!projectId || !memberId) { 
        throw new AppError('Empty input')
    }

    try {

        if ( req.memberPermissions?.includes('viewMemberProductivity')){
    
            const result = await teamMemberService.getMemberProductivity(projectId, memberId);
            res.status(200).json({productivityData: result})
            return ;
        }
        else{
            throw new AppError('No permission to edit task')
        }

	} catch(error) { 
    	next (error);
	}
}

const teamMemberController = {
	changeTeamMemberRole,
	removeTeamMember,
	getMemberProductivity,
};

export default teamMemberController;
