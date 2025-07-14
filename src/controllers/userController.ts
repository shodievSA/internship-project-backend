import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { UserData } from '@/types';

const {
    getUserData,
    getContacts,
    getUserNotifications,
    getInvites,
    deleteNotification,
    updateNotification    
} = userService;

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

async function getMailContacts(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const connections = await getContacts(req.user.id);
		res.status(200).json({ contacts: connections });
		return;

	} catch (error) {

		next(error);

	}

}

async function fetchUserNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const userId: number = req.user.id;

	try {

		const notifications = await getUserNotifications(userId);
		res.status(200).json({ message: 'Notifications fetched successfully', notifications });

		return;

	} catch (error) {

		next(error);

	}

}

async function getInvitations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {  

    try {

        const invites = await getInvites(req.user.id);
        res.status(200).json({ invites: invites });

  	} catch (error) {

    	next(error);

  	}

}

async function deleteNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

    try {

        const notificationsToDelete = req.body.notificationsToDelete as { notificationIds: number[]}

        const message = await deleteNotification(req.user.id, notificationsToDelete.notificationIds)

        res.status(200).json({ message: message });

  	} catch (error) {

    	next(error);

  	}

}

async function updateNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

        const notificationViewUpdates = req.body.notificationViewUpdates as { notificationIds: number[], isViewed:boolean}
        const newRecords = await updateNotification(req.user.id, notificationViewUpdates)

        res.status(200).json({ updatedNotifications: newRecords });

  	} catch (error) {

    	next(error);

  	}

}

async function getDailyReport(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const userId = req.user.id;
		const report = await userService.getDailyReport(userId);

		res.status(200).json({ report: report });

	} catch(err) {

		next(err);

	}

}

const userController = {
    getMe,
    getMailContacts,
    fetchUserNotifications,
    getInvitations,
    deleteNotifications,
    updateNotifications,
	getDailyReport
}

export default userController;
