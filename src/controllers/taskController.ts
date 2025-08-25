import { Response, NextFunction } from 'express';
import taskService from '../services/taskService';
import { AppError, TaskInfoFromUser } from '@/types';
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

	try {

		const taskId: number = parseInt(req.params.taskId);
		const projectId: number = parseInt(req.params.projectId);
		
		const { updatedTaskStatus, comment }: {
			updatedTaskStatus: 'under review' | 'rejected' | 'closed';
			comment: string;
		} = req.body;

		const fullname = req.user.fullName as string;

		if (!taskId) throw new AppError("Task id is missing", 400, true);
		if (!updatedTaskStatus) throw new AppError("Updated task status is missing", 400, true);

		const updatedTask = await taskService.changeTaskStatus(projectId, taskId, updatedTaskStatus, comment, fullname);

		res.status(200).json({ 
			message: "Task status changed successfully", 
			updatedTask: updatedTask 
		});

	} catch (err) {

		next(err);

	}

}

async function createTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('assignTasks')) { 

			throw new AppError("You don't have enough permissions to create tasks", 403, true);

		} else {

			const task: TaskInfoFromUser = {
				title: req.body.title,
				description: req.body.description,
				priority: req.body.priority,
				deadline: new Date(req.body.deadline),
				assignedTo: Number(req.body.assignedTo),
				assignedBy: Number(req.body.assignedBy),
				projectId: Number(req.body.projectId),
				sprintId: Number(req.body.sprintId)
			};

			if (!hasOnlyKeysOfB(task, models.Task)) {
				throw new AppError("Invalid fields have been provided in the request body", 400, true);
			}

			if (Number.isNaN(task.deadline.getTime())) {
				throw new AppError("Invalid deadline format", 400);
			}

			if (task.deadline.getTime() < Date.now()) {
				throw new AppError("Deadline cannot be in the past", 400);
			}

			const projectId: number = parseInt(req.params.projectId);
			const userId = req.user.id;

			const files = req.files as Express.Multer.File[] ?? [];
			const sizes: number[] = files.map(file => file.size);
			const fileNames: string[] = files.map((file) => file.originalname);

			const newTask = await taskService.createTask(task, userId, projectId, fileNames, sizes, files);

			res.status(201).json({ newTask });

		}

	} catch (err) {

		next(err);

	}

}

async function deleteTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	
	try {

		if (!req.memberPermissions?.includes('deleteTasks')) {

			throw new AppError("You don't have enough permissions to delete tasks", 403, true);

		} else {

			const projectId = parseInt(req.params.projectId);
			const taskId = parseInt(req.params.taskId);

			await taskService.deleteTask(req.user.id, projectId, taskId);

			res.status(200).json({ message: "The task has been deleted successfully!" });

		}

	} catch (err) {

		next(err);

	}

}

async function updateTask(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		if (!req.memberPermissions?.includes('editTasks')) {

			throw new AppError("You don't have enough permissions to edit the task", 403, true);

		} else {

			const projectId = parseInt(req.params.projectId);
			const taskId = parseInt(req.params.taskId);
			const filesToAdd = (req.files as Record<string, Express.Multer.File[]>)?.['filesToAdd'] ?? [];
			const filesToDelete: number[] = req.body.filesToDelete ? JSON.parse(req.body.filesToDelete) : [];
			const sizes: number[] = filesToAdd.map(file => file.size);
			const fileNames: string[] = filesToAdd.map((file) => file.originalname);
			const updatedTaskProps: Partial<TaskAttributes> = req.body.updatedTaskProps ? JSON.parse(req.body.updatedTaskProps) : {};

			if (!projectId || !taskId) {
				throw new AppError("Project id or task id is missing", 400, true);
			}

			if (!hasOnlyKeysOfB(updatedTaskProps, models.Task)) {
				throw new AppError("Invalid fields have been provided", 400, true);
			}

			const taskUpdatePayload: TaskUpdatePayload = {
				projectId,
				taskId,
				filesToAdd,
				filesToDelete,
				sizes,
				fileNames,
				updatedTaskProps,
			};

			const updatedTask = await taskService.updateTask(taskUpdatePayload);

			res.status(200).json({ updatedTask });

		}

	} catch (err) {

		next(err);

	}

}

async function getTaskFiles(
	req : AuthenticatedRequest,
    res : Response,
    next: NextFunction
): Promise<void> {

	try {

		const taskId: number = parseInt(req.params.taskId);

		if (!taskId) throw new AppError("Task id is missing", 400, true);

		const fileAttachments = await taskService.getTaskFiles(taskId);

		res.status(200).json({ fileUrls: fileAttachments });
        
        return;
	
	} catch (err) {

		next(err);

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
