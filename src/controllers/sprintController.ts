import { Response, NextFunction } from 'express';
import sprintService from '../services/sprintService';
import { AppError, FrontSprintAttributes } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import { hasOnlyKeysOfB } from '@/middlewares/isCorrectKeys';
import { models } from '@/models';

async function createSprint(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction  
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('assignTasks')) {

			throw new AppError("You don't have enough permissions to create sprints", 403, true);

		} else {
			
			const projectId = parseInt(req.params.projectId);
			const sprintInfo = req.body.sprint;
	
			if (!projectId) throw new AppError("Project id is missing", 400, true);

			if (!hasOnlyKeysOfB(sprintInfo, models.Sprint)) { 
				throw new AppError("Invalid fields in request body", 400, true);
			}

			if (
				new Date(sprintInfo.startDate).getTime() < (Date.now() - 24 * 60 * 60 * 1000) 
				|| 
				new Date(sprintInfo.endDate).getTime() < new Date(sprintInfo.startDate).getTime()
			) {
				throw new AppError("Invalid time intervals", 400, true);
			}

			const newSprint = await sprintService.createSprint(projectId, sprintInfo as FrontSprintAttributes);

			res.status(200).json({ newSprint });

		}

	} catch (err) {

		next(err);

	}

}

async function getSprintsTasks(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId = parseInt(req.params.projectId);
    const sprintId = parseInt(req.params.sprintId);

	try {

        if (!projectId || !sprintId) {

			throw new AppError("Project id or sprint id is missing", 400, true);

		}
		
		const sprintDetails = await sprintService.getSprintDetails(projectId, sprintId);

		res.status(200).json({ 
			tasks: sprintDetails.tasks, 
			metaData: sprintDetails.metaData 
		});

	} catch (err) {

		next(err);

	}

}

async function updateSprint(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('editProject')) {

			throw new AppError("You don't have enough permissions to edit the sprint", 403, true);

		} else {

			const projectId: number = parseInt(req.params.projectId);
			const sprintId: number = parseInt(req.params.sprintId);
			const updatedSprintProps = req.body.updatedSprintProps;

			const allowedStatuses = ['planned', 'active', 'completed', 'overdue'] as const;
			type Status = typeof allowedStatuses[number];

			const title = updatedSprintProps.title;
			const description = updatedSprintProps.description
			const status = updatedSprintProps.status;

			let startDate: Date | undefined = undefined;
			let endDate: Date | undefined = undefined;

			if (updatedSprintProps.startDate) { 
			    startDate = new Date(updatedSprintProps?.startDate);
			}
			
			if (updatedSprintProps.endDate) { 
			    endDate = new Date(updatedSprintProps?.endDate);
			}

			const updatedFields: Partial<{ 
			    title: string;
			    description:string;
			    status: Status;
			    startDate: Date | undefined;
			    endDate: Date | undefined;
			}> = { title, description, status, startDate, endDate };

			if (Object.keys(updatedFields).length === 0) {

				throw new AppError("Invalid fields have been provided for sprint update", 400, true);

			}

			const updatedSprint = await sprintService.updateSprint(projectId, sprintId, updatedFields);

			res.status(200).json({ 
				message: "Sprint has been updated successfully", 
				updatedSprint: updatedSprint 
			});

		}

	} catch (err) {

		next(err);

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

        if (!req.memberPermissions?.includes('deleteProject')) {

			throw new AppError("You don't have enough permissions to delete this sprint", 403, true);
            
        } else { 

            await sprintService.deleteSprint(projectId, sprintId);
    
            res.status(200).json({ message: "Sprint has been deleted successfully!" });

        }

	} catch (err) {

		next(err);

	}

}

async function getAllSprints(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);

	try {

		if (!projectId) throw new AppError("Invalid project id", 400, true);

		const sprints = await sprintService.getAllSprints(projectId);

		res.status(200).json({ sprints });

	} catch (err) {

		next(err);

	}

}

async function getDefaultSprint(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);

	try {

		if (!projectId) throw new AppError("Project id is missing", 400, true);
		
		const defaultSprint = await sprintService.getDefaultSprint(projectId);

		res.status(200).json({ defaultSprint });

	} catch (err) {

		next(err);

	}

}

const sprintController = {
	createSprint,
	getSprintsTasks,
	updateSprint,
	deleteSprint,
	getAllSprints,
	getDefaultSprint,
};

export default sprintController;
