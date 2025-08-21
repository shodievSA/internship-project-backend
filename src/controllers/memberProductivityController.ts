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

};

export default { getMyProductivityData }; 