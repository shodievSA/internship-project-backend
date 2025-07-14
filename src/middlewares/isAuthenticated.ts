import { Request, Response, NextFunction } from 'express';

function isAuthenticated(
	req: Request, 
	res: Response, 
	next: NextFunction
): void {

	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect(`${process.env.FRONTEND_URL}/sign-in`);

};

export default isAuthenticated;