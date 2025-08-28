import { models } from '../models';
import { AppError, FrontInvite, UserData } from '@/types';
import { runCryptoWorker } from '@/utils/cryptoWorkerHelper';
import { Contact, GooglePerson } from '@/types';
import Project from '@/models/project';
import User from '@/models/user';
import { auth, people } from 'googleapis/build/src/apis/people';
import sequelize from '@/config/sequelize';
import { Op, Transaction } from 'sequelize';
import { DateTime } from 'luxon';
import DailyAiReport from '@/models/dailyAiReport';
import { GmailType } from '../services/gmaiService';
import { sendEmailToQueue } from '@/queues';

async function getUserData(userId: number): Promise<UserData | null> {

	try {

		const user = await models.User.findByPk(userId, {
			attributes: [
				'id',
				'email',
				'fullName',
				'avatarUrl',
				'createdAt',
				'isInvited'
			],
		});

		return user ? (user.toJSON() as UserData) : null;

	} catch (err) {

		throw err;
		
	}

}

async function getContacts(userId: number): Promise<Contact[]> {
	
	try {

		const user = await models.User.findOne({ 
			where: { id: userId },
			attributes : ['refreshToken']
		});

		const refreshToken = await runCryptoWorker(
			'decrypt', user?.refreshToken!, process.env.ENCRYPTION_KEY!
		);

		const oauth2Client = new auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID!,
			process.env.GOOGLE_CLIENT_SECRET!,
			`${process.env.BASE_URL}/api/v1/auth/google/callback`
		);

		oauth2Client.setCredentials({ refresh_token: refreshToken });

		const peopleAPI = people({ version: 'v1', auth: oauth2Client });

		let allConnections : Contact[] = [];
		let nextPageToken : string | undefined = undefined; 

		do {

			const response : any = await peopleAPI.people.connections.list({
				resourceName: 'people/me',
				pageSize: 100,
				personFields: 'names,emailAddresses,photos',
				pageToken : nextPageToken,
			});

            if (!response) throw new AppError("Failed to get user's connections", 502, true);

			const connections: GooglePerson[] = response.data.connections || []
			const connectionsWithEmail = connections.filter((connection) => {
				return connection.emailAddresses
			});

			if (connectionsWithEmail.length > 0) {

				const mapped = connectionsWithEmail.map((person) => ({
					email : person.emailAddresses[0].value,
					fullName : person.names[0].displayName,
					avatarUrl : person?.photos?.[0].url ?? null
				}));
			
				allConnections = [...allConnections, ...mapped];

			}

			nextPageToken = response.data.nextPageToken; 

		} while (nextPageToken);

		return allConnections;

	} catch (err) { 

        throw err

	}

}

async function getUserNotifications(userId: number): Promise<object> {
	
	try {

		const notifications = await models.Notification.findAll({
			where: {
				userId: userId
			},
			attributes: { exclude: ['user_id'] },
			order: [["createdAt", "DESC"]]
		});

		return notifications;
		
	} catch (err) {
		
		throw err;

	}

}

async function getInvites(userId: number): Promise<FrontInvite[]> {
    
    try { 

        const rawInvites = await models.Invite.findAll({
            where: { invitedUserId : userId },
            include : [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['title']
                    
                },
                {
                    model : User, 
                    as: "inviter",
                    attributes : ['fullName', 'email', 'avatarUrl']
                }
            ],
			order: [[ 'createdAt', 'DESC' ]]
        });

        const invites: FrontInvite[] = [];
		
		for (const record of rawInvites) {

			invites.push({
				id: record.id,
				projectId: record.projectId,
				project: { 
					title: record.project.title,       
				},
				from: { 
					fullName: record.inviter.fullName as string,
					email: record.inviter.email,
					avatarUrl: record.inviter.avatarUrl,               
				},
				positionOffered: record.positionOffered,
				roleOffered: record.roleOffered,
				status: record.status,
				createdAt: record.createdAt,
				updatedAt: record.updatedAt,
			});

        };

        return invites;

    } catch(err) { 

        throw err;

    }

}

async function deleteNotification( 
	userId: number, 
	notificationIds: number[]
): Promise<void> { 
    
    const transaction: Transaction = await sequelize.transaction();

    try {
        
        const usersNotifications = await models.Notification.findAll({
            where: {
                id: notificationIds,
                userId: userId,
            },
            attributes: ['id'],
            transaction
        });

        if (usersNotifications.length === 0 ) { 

            throw new AppError("Failed to find notifications to delete", 404, true);

        }

        const notificationsToDelete: number[] = [];

        for (const notification of usersNotifications) { 

            notificationsToDelete.push(notification.id);

        }
        
        await models.Notification.destroy({
            where: {
                id: notificationsToDelete
            },
            transaction
        });

        transaction.commit();

    } catch (err) { 

        transaction.rollback();
        throw err;

    }

}

async function updateNotification( 
    userId: number,
    notificationViewUpdates: {
        notificationIds: number[],
        isViewed: boolean,
    }
) {

    const transaction = await sequelize.transaction();

    try {

        await models.Notification.update(
			{
            	isViewed: notificationViewUpdates.isViewed,
        	},
			{
				where: { 
					id: notificationViewUpdates.notificationIds,
					userId: userId,
				},
				returning: true,
				transaction,
			}
		);

        transaction.commit();

        return { 
            notificationIds: notificationViewUpdates.notificationIds,
            updatedViewStatus: notificationViewUpdates.isViewed
        };

    } catch (err) { 

        transaction.rollback();
        throw err;

    }
    
}

async function getDailyReport(userId: number) {

	const localDate = DateTime.local().setZone("Asia/Tashkent");
	const startOfDay = localDate.startOf("day").toJSDate();
	const endOfDay = localDate.endOf("day").toJSDate();

	const dailyReport = await DailyAiReport.findOne({
		where: {
			userId: userId,
			createdAt: {
				[Op.between]: [startOfDay, endOfDay]
			}
		}
	});

	if (!dailyReport) {

		return null;

	}

	return dailyReport;

}

async function updateUserInviteStatus(
	inviteStatus: 'accepted' | 'rejected', 
	inviteId: number
): Promise<object> {
	
	const transaction: Transaction = await sequelize.transaction();

	try {

		const [count] = await models.Invite.update({ status: inviteStatus }, {
			where: { id: inviteId },
			transaction
		});

		if (count === 0) throw new AppError("Failed to update user invite status", 404, true);

		const invite = await models.Invite.findByPk(inviteId, { 
			include: { 
				model: models.User, 
				as: 'inviter', 
				attributes: ['email']
			}, 
			transaction 
		});

		if (!invite) throw new AppError("Failed to find project invite after update", 404, true);			

		const { 
			projectId, 
			invitedUserId, 
			positionOffered, 
			roleOffered 
		} = invite;

		const [user, project] = await Promise.all([
			models.User.findByPk(invitedUserId, { transaction }),
			models.Project.findByPk(projectId, { transaction })
		]);

		if (!user) throw new AppError(`Couldn't find user with id ${invitedUserId}`, 404, true);
		if (!project) throw new AppError(`Couldn't find project with id ${projectId}`, 404, true);

		const roleId = (roleOffered === 'manager') ? 2 : 3;

		if (inviteStatus === 'accepted') {

			const newMember = await models.ProjectMember.create(
				{
					userId: invitedUserId,
					projectId: projectId,
					roleId: roleId,
					position: positionOffered,
				},
				{ transaction }
			);

			const [members, sprints, completedSprints, isAdmin] = await Promise.all([
				models.ProjectMember.count({ where: { projectId } }),
				models.Sprint.count({ where: { projectId } }),
				models.Sprint.count({ where: { projectId, status: 'completed' } }),
				models.ProjectMember.findOne({
					where: {
						projectId: projectId,
						userId: user.id,
						roleId: await models.Role.findOne({
							where: { name: 'admin' },
							attributes: ['id'],
						}).then((role) => role?.id),
					},
					raw: true,
				}).then((member) => !!member)
			]);

			const projectMetaData = {
				id: project.id,
				title: project.title,
				status: project.status,
				createdAt: project.createdAt,
				members: members,
				totalSprints: sprints,
				totalSprintsCompleted: completedSprints,
				isAdmin: isAdmin
			};

			await models.Notification.create({
				title: 'Project invitation accepted',
				message: `${user!.fullName} has joined the project!`,
				userId: invite.invitedBy
			}, { transaction });

			await transaction.commit();

			await sendEmailToQueue({
				type: GmailType.PROJECT_INVITE_ACCEPT,
				receiverEmail: invite.inviter.email,
				params: [project!.title, roleOffered, positionOffered, projectId]
			});

			return {
				invitation: invite.toJSON(),
				newMember: newMember,
				projectMetaData: projectMetaData
			};

		}

		if (inviteStatus === 'rejected') {

			await models.Notification.create({
				title: 'Project invitation rejected',
				message: `${user!.fullName} has rejected the project invitation!`,
				userId: invite.invitedBy
			}, { transaction });

			await transaction.commit();

			await sendEmailToQueue({
				type: GmailType.PROJECT_INVITE_REJECT,
				receiverEmail: invite.inviter.email,
				params: [project!.title, roleOffered, positionOffered, projectId]
			});

			return {
				invitation: invite.toJSON(),
			};

		}

		throw new AppError("Invalid invite status", 400, true);

	} catch (err) {

		if (!(transaction as any).finished) await transaction.rollback();
		throw err;

	}

}

const userService = { 
    getUserData,
    getContacts,
	getUserNotifications,
    getInvites,
    deleteNotification,
    updateNotification,
	getDailyReport,
	updateUserInviteStatus
}

export default userService;