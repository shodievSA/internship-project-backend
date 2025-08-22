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

        if (text.length < 100) {
            throw new Error('Not enough content provided');
        }

        const result: string | undefined = await aiService.Enhance(text);
        if (result === undefined ) { 
            throw new AppError("Error in enhancing");
        }
        res.status(200).json({ enhancedVersion: result })

    }
    catch (err) {

		return next(err);
        
	}

}

async function createTitle(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {

    if (!req.body.taskDescription) {
      throw new AppError("Empty fields", 429);
    }

    const description = req.body.taskDescription
    
    if (description.length < 20) {
      throw new Error('Not enough content provided');
    }
    
    const result = await aiService.CreateTitle(description);
    if (!result) {
      throw new AppError("Something went wrong");
    }

    res.status(200).json({ generatedTaskTitle: result });
  } catch (err) {
    next(err);
  }
}
const aiController = {
	enhanceText,
    createTitle,
};

export default aiController;
