import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { UserData } from '@/types';

const {
    getUserData,
    getContacts,
    getInvites,
} = userService

async function getMe(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {

		const userData: UserData | null = await getUserData(req.user.id);

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

    const connections = await getContacts(req.user.id);
    res.status(200).json(connections);
    return;

  } catch (error) {
    next(error);
  }
}

export async function getInvitations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
){  
    try{
        const notifications = await getInvites(req.user.id)
        res.status(200).json(notifications);

  } catch (error) {
    next(error);
  }
}

const userController = {
    getMe,
    getMailContacts,
    getInvitations,
}

export default userController;
