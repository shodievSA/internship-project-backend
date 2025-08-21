import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import aiService from '../services/aiService';
import { AppError } from '@/types';

async function enhanceText(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
) {

	try {

		const { text } = req.body;

		if (text.trim().length < 100) throw new AppError("The text is too small", 400, true);

		const enhancedText = await aiService.enhanceText(text);
		
		return res.status(200).json({ enhancedVersion: enhancedText });

	} catch (err) {

		return next(err);

	}

}

async function generateTaskTitle(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
) {

	try {

		const { taskDescription } = req.body;

		if (!taskDescription) throw new AppError("Task description is missing", 400, true);
		if (taskDescription.trim().length < 20) throw new AppError("Task description is too small", 400, true);

		const taskTitle = await aiService.generateTaskTitle(taskDescription);

		return res.status(200).json({ generatedTaskTitle: taskTitle });

	} catch (err) {

		return next(err);

	}
    
}

const aiController = {
	enhanceText,
    generateTaskTitle,
};

export default aiController;
