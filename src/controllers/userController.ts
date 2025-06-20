import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';

class UserController {

	public getMe(req: Request, res: Response, next: NextFunction) {

		if (!req.user) {
			return next(new Error('User not authenticated'));
		}

		const userId: number = ( req.user as { id: number } )?.id;

		userService
			.getUserData(userId)
			.then((userData) => {
				return res.status(200).json({ user: userData });
			})
			.catch((error) => {
				return next(new Error(error));
			});

	}

}

export default new UserController();