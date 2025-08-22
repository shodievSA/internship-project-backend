import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import aiService from '../services/aiService';
import { AppError } from '@/types';

async function enhanceText(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const text: string = req.body.text;

		if (text.trim().length < 100) throw new AppError("The text is too small", 400, true);

		const enhancedVersion = await aiService.enhanceText(text);
		
		res.status(200).json({ enhancedVersion });

	} catch (err) {

		next(err);

	}

}

async function generateTaskTitle(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const taskDescription: string = req.body.taskDescription;

		if (!taskDescription) throw new AppError("Task description is missing", 400, true);
		if (taskDescription.trim().length < 20) throw new AppError("Task description is too small", 400, true);

		const generatedTaskTitle = await aiService.generateTaskTitle(taskDescription);

		res.status(200).json({ generatedTaskTitle });

	} catch (err) {

		next(err);

	}

}

const aiController = {
	enhanceText,
    generateTaskTitle,
};

export default aiController;
