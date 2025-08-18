import { Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { AppError, FrontSprintAttributes } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import { hasOnlyKeysOfB } from '@/middlewares/isCorrectKeys';
import { models } from '@/models';

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

        if (!projectId || !sprintId) throw new AppError('Empty input');
		
		const sprintDetails = await projectService.getSprintDetails(projectId, sprintId);

		res.status(200).json({ tasks: sprintDetails.tasks, metaData: sprintDetails.metaData });

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

		const allowedStatuses = ['planned', 'active', 'completed', 'overdue'] as const;
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
            endDate: Date | undefined;
		}> = { title, description, status, startDate, endDate };

		if (Object.keys(updatedFields).length === 0) {

			res.status(400).json({ error: 'No valid fields provided for update' });
			return;

		}

		if (req.memberPermissions?.includes('editProject')) {

			const updatedSprint = await projectService.updateSprint(projectId, sprintId, updatedFields);
			res.status(200).json({ message: 'Project updated successfully', updatedSprint });

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

        if (req.memberPermissions?.includes('deleteProject')) {
            
            await projectService.deleteSprint(projectId, sprintId);
    
            res.sendStatus(204);
            
        } else { 

            throw new AppError("No required permission");

        }

	} catch (error) {

		next(error);

	}

}

async function getAllSprints(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const projectId: number = parseInt(req.params.projectId);

	try {

		if (!projectId || isNaN(projectId)) {
			res.status(400).json({ error: 'Invalid project ID' });
			return;
		}

		const sprints = await projectService.getAllSprints(projectId);
		res.status(200).json({ sprints });

	} catch (error) {

		next(error);

	}

}

async function getDefaultSprint(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	const projectId: number = parseInt(req.params.projectId);
	try {
		if (!projectId || isNaN(projectId)) {
			res.status(400).json({ error: 'Invalid project ID' });
			return;
		}
		
		const defaultSprint = await projectService.getDefaultSprint(projectId);
		res.status(200).json({ defaultSprint });
	} catch (error) {
		next(error);
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
