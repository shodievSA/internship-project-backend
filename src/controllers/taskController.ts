import { Response, NextFunction } from 'express';
import taskService from '../services/taskService';
import { AppError } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import { hasOnlyKeysOfB } from '@/middlewares/isCorrectKeys';
import { models } from '@/models';
import { TaskUpdatePayload } from '@/types';
import { TaskAttributes } from '@/models/task';

async function changeTaskStatus(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const taskId: number = parseInt(req.params.taskId);
	const projectId: number = parseInt(req.params.projectId);
	
	const { updatedTaskStatus, comment }: {
		updatedTaskStatus: 'under review' | 'rejected' | 'closed';
		comment: string;
	} = req.body;

	const fullname = req.user.fullName as string;

	if (!taskId) {

		res.status(400).json({ error: 'Task Id is missing' });
		return;

	}

	if (!updatedTaskStatus) {

		res.status(400).json({ error: 'Missing updatedTaskStatus' });
		return;

	}

	try {

		const updatedTask = await taskService.changeTaskStatus(projectId, taskId, updatedTaskStatus, comment, fullname);
		res.status(200).json({ message: 'Task status changed successfully', updatedTask });

	} catch (error) {

		next(error);

	}

}

async function createTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<any> {

	const task: {

		title: string;
		description: string;
		priority: string;
		deadline: string;
		assignedTo: number;
		assignedBy: number;
		projectId: number;
		sprintId: number;

	} = {

		title: req.body.title,
		description: req.body.description,
		priority: req.body.priority,
		deadline: req.body.deadline,
		assignedTo: Number(req.body.assignedTo),
		assignedBy: Number(req.body.assignedBy),
		projectId: Number(req.body.projectId),
		sprintId: Number(req.body.sprintId)

	};

	const projectId: number = parseInt(req.params.projectId);
	const userId = req.user.id;

	const files = req.files as Express.Multer.File[] ?? [];
	const sizes: number[] = files.map(file => file.size);
	const fileNames: string[] = files.map((file) => file.originalname);

	try { 
		
        if (!hasOnlyKeysOfB(task, models.Task)) { 
            throw new AppError('Invalid fields in request body');
        }

		if (req.memberPermissions?.includes('assignTasks')) { 

			const newTask = await taskService.createTask(
				task, userId, projectId, fileNames, sizes, files
			);
			return res.status(201).json({ newTask });

		}

		return res.status(403).json({ message: 'Permission required' });

	} catch (error) {

		next(error);

    }
}

async function deleteTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	try {
		const projectId = parseInt(req.params.projectId)
		const taskId = parseInt(req.params.taskId)

		if (req.memberPermissions?.includes('deleteTasks')) {

			await taskService.deleteTask(req.user.id, projectId, taskId)
			res.sendStatus(204)
			return
		}
		throw new AppError('No permission', 403)
	}
	catch (error) {

		next(error);
	}
}

async function updateTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {

	const projectId = parseInt(req.params.projectId);
	const taskId = parseInt(req.params.taskId);
	const filesToAdd = (req.files as Record<string, Express.Multer.File[]>)?.['filesToAdd'] ?? [];
	const filesToDelete: number[] = req.body.filesToDelete ? JSON.parse(req.body.filesToDelete) : [];
	const sizes: number[] = filesToAdd.map(file => file.size);
	const fileNames: string[] = filesToAdd.map((file) => file.originalname);
	const updatedTaskProps: Partial<TaskAttributes> = req.body.updatedTaskProps ? JSON.parse(req.body.updatedTaskProps) : {};

	if (!projectId || !taskId) throw new AppError('Empty input');
	if (!hasOnlyKeysOfB(updatedTaskProps, models.Task)) throw new AppError('Invalid fields forbidden');

	const taskUpdatePayload: TaskUpdatePayload = {
		projectId,
		taskId,
		filesToAdd,
		filesToDelete,
		sizes,
		fileNames,
		updatedTaskProps,
	}
	
	try {

		if (req.memberPermissions?.includes('editTasks')) {

			const result = await taskService.updateTask(taskUpdatePayload);
			return res.status(200).json({ updatedTask: result });

		} else {

			throw new AppError('No permission to edit task');

		}

	} catch(error) { 

		next (error);

	}

}

async function getTaskFiles(
	req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
) {

	try {

		const taskId: number = parseInt(req.params.taskId);

		if (!taskId ) throw new AppError('taskId is missing');

		const fileAttachments = await taskService.getTaskFiles(taskId);

		return res.status(200).json({ fileUrls: fileAttachments });
	
	} catch (error) {
		next (error);
	}
	
}

const taskController = {
	changeTaskStatus,
	createTask,
	deleteTask,
	updateTask,
	getTaskFiles,
};

export default taskController;
