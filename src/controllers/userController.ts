import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import { AppError, UserData } from '@/types';

async function getMe(
	req: AuthenticatedRequest, 
	res: Response, 
	next: NextFunction
): Promise<void> {

	try {    

		const userData: UserData | null = await userService.getUserData(req.user.id);

		res.status(200).json({ user: userData });

	} catch (err) {

		next(err);

	}

}

async function getMailContacts(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

		const connections = await userService.getContacts(req.user.id);

		res.status(200).json({ contacts: connections });

	} catch (err) {

		next(err);

	}

}

async function fetchUserNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const userId: number = req.user.id;

	try {

		const notifications = await userService.getUserNotifications(userId);

		res.status(200).json({ 
			message: "Notifications fetched successfully", 
			notifications: notifications 
		});

	} catch (err) {

		next(err);

	}

}

async function getInvitations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {  

    try {

        const invites = await userService.getInvites(req.user.id);

        res.status(200).json({ invites });

  	} catch (err) {

    	next(err);

  	}

}

async function deleteNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

    try {

        const notificationsToDelete = req.body.notificationsToDelete as { notificationIds: number[] };

        await userService.deleteNotification(req.user.id, notificationsToDelete.notificationIds);

        res.status(200).json({ message: "Notifications have been deleted successfully!" });

  	} catch (err) {

    	next(err);

  	}

}

async function updateNotifications(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {

        const notificationViewUpdates = req.body.notificationViewUpdates as { notificationIds: number[], isViewed: boolean };

        const newRecords = await userService.updateNotification(req.user.id, notificationViewUpdates);

        res.status(200).json({ updatedNotifications: newRecords });

  	} catch (err) {

    	next(err);

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

		res.status(200).json({ report });

	} catch (err) {

		next(err);

	}

}

async function updateUserInviteStatus(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	try {
		
		const inviteStatus: 'accepted' | 'rejected' = req.body.status;
		const inviteId: number = parseInt(req.params.inviteId);

		if (!inviteStatus) throw new AppError("Updated invite status is missing", 400, true);
		if (!inviteId) throw new AppError("Invite id is missing", 400, true);
		
		const inviteInfo = await userService.updateUserInviteStatus(inviteStatus, inviteId);

		res.status(200).json({ 
			message: "Project invitation status changed successfully", 
			inviteInfo: inviteInfo 
		});

	} catch (err) {

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
	getDailyReport,
	updateUserInviteStatus
}

export default userController;
