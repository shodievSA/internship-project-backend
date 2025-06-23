import { Request, Response, NextFunction } from 'express';

function isAuthenticated(
	req: Request, 
	res: Response, 
	next: NextFunction
): void {

	if (req.isAuthenticated()) {
		return next();
	}

	res.status(401).json({ message: 'Unauthorized. Please log in.' });

};

export default isAuthenticated;