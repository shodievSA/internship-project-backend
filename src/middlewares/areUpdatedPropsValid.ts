import { Request, Response,NextFunction } from 'express';

export const isProjectUpdateValid = (req: Request, res: Response, next: NextFunction) => {

    const updatedProjectProps = req.body.updatedProjectProps;
    const projectId: number = parseInt(req.params.projectId);

    if (!updatedProjectProps) {

		res.status(400).json({ error: 'Updated object does not exist' });
        return;

	}

    if (!projectId) {

        res.status(400).json({ error: 'Project ID is required' });
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