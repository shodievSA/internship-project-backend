import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import aiService from '../services/aiService';
import { AppError } from '@/types';

async function enhanceText(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
) {

	return aiService
		.Enhance(req.body.text)
		.then((result: string | undefined) => {
		return res.status(200).json({ enhancedVersion: result });
		})
		.catch((err) => {
		return next(err);
		});

}

async function createTitle(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
) {
    if (!req.body.taskDescription){
        throw new AppError("Empty fields",429)
    }
    return aiService
    .CreateTitle(req.body.taskDescription)
    .then((result: string | undefined)=> { 
        if (result === undefined) { 
            console.log(result)
            throw new AppError("Something went wrong")
        }

        return res.status(200).json({ generatedTaskTitle: result })
    })
    .catch((err) => {
		return next(err);
    });
    
}

const aiController = {
	enhanceText,
    createTitle,
};

export default aiController;
