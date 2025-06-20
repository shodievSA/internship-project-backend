import { Request, Response, NextFunction } from 'express';
import userService from '../services/userService';
import { UserData } from '@/types';
import projectController from './projectController';

class UserController {

	public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {

		try {

			if (req.user) {

				const userId: number = (req.user as any)?.id;
				const userData: UserData | null = await userService.getUserData(userId);

				res.status(200).json({ user: userData });

			}

		} catch (error) {

			next(error);

		}

	}

}

export default new UserController();
