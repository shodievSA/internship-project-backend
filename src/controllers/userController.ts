import { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import userService from '../services/userService';
import teamMemberService from '../services/teamMemberService';
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

async function updateUserInviteStatus(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {

	const inviteStatus: 'accepted' | 'rejected' = req.body.status;
	const inviteId: number = parseInt(req.params.inviteId);

	try {

		if (!inviteStatus) {

			res.status(400).json({
				error: 'inviteStatus is missing'
			});

			return;

		} else if (!inviteId) {

			res.status(400).json({
				error: 'inviteId is missing'
			});

			return;

		} else {

			const inviteInfo = await userService.updateUserInviteStatus(inviteStatus, inviteId);

			res.status(200).json({ 
				message: 'Project invitation status changed successfully', 
				inviteInfo: inviteInfo 
			});

		}

	} catch (error) {

		next(error);

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
