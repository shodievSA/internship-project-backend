import { Request, Response,NextFunction } from 'express';

export const projectUpdateValid = (req: Request, res: Response, next: NextFunction) => {

    const updatedProjectProps = req.body.updatedProjectProps;

    if (!updatedProjectProps) {
		res.status(400).json({ error: 'Updated object does not exist' });
        return;
	}

    if (!('title' in updatedProjectProps) || !('status' in updatedProjectProps)) {
        res.status(400).json({ error: 'Both "title" and "status" must be provided for update' });
        return;
    }

    const title = updatedProjectProps.title;

    if (typeof title !== 'string') {
		res.status(400).json({ error: 'Title must be a string' });
		return;
	}

    const keys = Object.keys(updatedProjectProps);
    const isValidKeysOnly = keys.every((key) => key === 'title' || key === 'status');

    if (!isValidKeysOnly) {
        res.status(400).json({ error: 'Only title and status fields are allowed for updates' });
        return;
    }

    next();
    
}