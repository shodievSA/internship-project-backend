import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { UserData } from '@/types';

const {
    getUserData,
    getContacts,
    getUserNotifications,
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
    return;

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

export async function fetchUserNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {

  const userId: number = req.user.id;

  try {

    const notifications = await userService.getUserNotifications(userId);
    res.status(200).json({ message: 'Notifications fetched successfully', notifications });

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
    fetchUserNotifications,
    getInvitations,
}

export default userController;
