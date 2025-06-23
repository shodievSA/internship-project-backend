import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import aiService from '../services/aiService';

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
		return next(new Error(err));
		});

}

const aiController = {
	enhanceText
};

export default aiController;
