import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { UserData } from '@/types';

async function getMe(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const userId: number = req.user.id;
		const userData: UserData | null = await userService.getUserData(userId);

		res.status(200).json({ user: userData });

	} catch (error) {

		next(error);

	}

}

const userController = {
	getMe
}

export default userController;
