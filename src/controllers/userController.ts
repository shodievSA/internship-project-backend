import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { UserData } from '@/types';

const {
    getUserData,
    getContacts,
} = userService

async function getMe(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const userData: UserData | null = await userService.getUserData(req.user.id);

		res.status(200).json({ user: userData });
        return

	} catch (error) {

		next(error);

	}

}

export async function getMailContacts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {

    const connections = await userService.getContacts(req.user.id);
    res.status(200).json({ contacts: connections });
    return;

  } catch (error) {
    next(error);
  }
}

const userController = {
    getMe,
    getMailContacts,
}

export default userController;
