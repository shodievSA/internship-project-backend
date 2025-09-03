import { NextFunction, Response } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import memberProductivityService from '../services/memberProductivityService';
import { AppError } from '@/types';

async function getMyProductivityData(
	req: AuthenticatedRequest, 
	res: Response,
	next: NextFunction
): Promise<void> {

	try {
		
		const projectId = parseInt(req.params.projectId);
		const userId = req.user.id;

		if (isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
		if (!userId) throw new AppError("User not authenticated", 401, true);

		const filters: any = {};
		
		if (req.query.sprintId) {

			const sprintId = parseInt(req.query.sprintId as string);

			if (!isNaN(sprintId)) {

				filters.sprintId = sprintId;

			}

		}

		const productivityData = await memberProductivityService.getMemberProductivity(userId, projectId, filters);

		res.status(200).json({ data: productivityData });

	} catch (err) {

		next(err);

	}

}

async function getMemberProductivityData(
	req: AuthenticatedRequest, 
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const projectId = parseInt(req.params.projectId);
		const memberId = parseInt(req.params.memberId); // New parameter
		const currentUserId = req.user.id;

		if (isNaN(projectId)) throw new AppError("Invalid project id", 400, true);
		if (isNaN(memberId)) throw new AppError("Invalid member id", 400, true);
		if (!currentUserId) throw new AppError("User not authenticated", 401, true);

		const filters: any = {};
		
		if (req.query.sprintId) {
			const sprintId = parseInt(req.query.sprintId as string);
			if (!isNaN(sprintId)) {
				filters.sprintId = sprintId;
			}
		}

		// Check if current user can view this member's data
		const canView = await memberProductivityService.canViewMemberProductivity(
			currentUserId, 
			projectId, 
			memberId
		);

		if (!canView) {
			throw new AppError("You don't have permission to view this member's productivity", 403, true);
		}

		const productivityData = await memberProductivityService.getMemberProductivity(memberId, projectId, filters);
		res.status(200).json({ data: productivityData });

	} catch (err) {
		next(err);
	}
}

export default { 
	getMyProductivityData,
	getMemberProductivityData // Export the new method
}; 