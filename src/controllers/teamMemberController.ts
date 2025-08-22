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

        if (
			!req.memberPermissions?.includes('promoteMembers') 
			|| 
			!req.memberPermissions?.includes("demoteMembers")
		) {

            throw new AppError("You don't have enough permissions to change team members' roles", 403, true);

        } else {

			const projectId: number = parseInt(req.params.projectId);
			const memberId: number = parseInt(req.params.memberId);
			const newRole = req.body.newRole;
			
			if (!projectId || !memberId) {

				throw new AppError("Project id and member id are required", 400, true);

			}
	
			if (!newRole) throw new AppError("Updated member role is missing", 400, true);
	
			const updatedTeamMember = await teamMemberService.updateTeamMemberRole(projectId, memberId, newRole);
	
			res.status(200).json({ updatedTeamMember });

		}

	} catch (err) {

		next(err);

	}

}

async function removeTeamMember(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('kickOutTeamMembers')) { // issue
	
			throw new AppError("You don't have enough permissions to remove team members", 403, true);
	
		} else {

			const projectId: number = parseInt(req.params.projectId);
			const memberId: number = parseInt(req.params.memberId);
	
			if (!projectId || !memberId) throw new AppError("Project id and member id are required", 400, true);

			await teamMemberService.removeTeamMember(projectId, memberId);

			res.status(200).json({ message: "The team member has been successfully removed from the project!" });
	
		}

	} catch (err) {
	
		next(err);

	}

}

async function getMemberProductivity(
    req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('viewMemberProductivity')) {

			throw new AppError(
				"You don't have enough permissions to view team members' productivity information", 403, true
			);

		} else {

			const projectId = parseInt(req.params.projectId);
			const memberId = parseInt(req.params.memberId);
		
			if (!projectId || !memberId) throw new AppError("Project id and member id are required", 400, true);
		
			const result = await teamMemberService.getMemberProductivity(projectId, memberId);

			res.status(200).json({ productivityData: result });

		}

	} catch (err) { 
	
		next(err);
	
	}

}

const teamMemberController = {
	changeTeamMemberRole,
	removeTeamMember,
	getMemberProductivity,
};

export default teamMemberController;
