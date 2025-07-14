import { models } from '../models';
import { AppError, FrontInvite, UserData } from '@/types';
import { decryptToken } from '../config/passport';
import { Contact, GooglePerson } from '@/types';
import Project from '@/models/project';
import User from '@/models/user';
import { auth, people } from 'googleapis/build/src/apis/people';
import sequelize from '@/clients/sequelize';
import { Op, Transaction } from 'sequelize';
import { DateTime } from 'luxon';
import DailyAiReport from '@/models/dailyAiReport';
import { DailyReport } from '@/types/dailyReport';

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

	} catch (error) {

		throw new AppError(`${error}`,500);
		
	}

}

async function getContacts(userId : number ): Promise<Contact[]> {
	
	try {

		const user = await models.User.findOne({ 
			where: { id: userId },
			attributes : ['refreshToken']
		});

		const refreshToken = decryptToken(user?.refreshToken!);

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
            if ( !response) { 
                throw new AppError('Could not get list of connections', 502);
            }
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

	} catch(error) { 
        throw error
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
		
	} catch (error) {
		
		throw new AppError(`${error}`);

	}

}

async function getInvites( userId: number ): Promise<FrontInvite[]> {
    
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

        if (!rawInvites) {
            throw new AppError('No Invites found')
        }

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

    } catch(error) { 

        throw error

    }

}

async function deleteNotification( 
	userId: number, 
	notificationIds: number[]
): Promise<string>{ 
    
    const transaction: Transaction = await sequelize.transaction();

    let message = 'Successfully deleted'

    try {
        
        const usersNotifications = await models.Notification.findAll({
            where: {
                id: notificationIds,
                userId: userId,
            },
            attributes: ['id'],
            transaction
        })

        if (usersNotifications.length === 0 ) { 

            throw new AppError('Empty or incorrect notification Ids');

        }

        const notificationsToDelete: number[] = []

        for (const notification of usersNotifications) { 

            notificationsToDelete.push(notification.id)
        }
        
        await models.Notification.destroy({
            where: {
                id: notificationsToDelete
            },
            transaction
        })

        transaction.commit()
        return message
    }
    catch (error) { 

        transaction.rollback()
        
        throw error
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

        await models.Notification.update({
            isViewed:notificationViewUpdates.isViewed,
        },
        {
            where: { 

                id: notificationViewUpdates.notificationIds,
                userId: userId,
            },
            returning: true,
            transaction,
        })

        transaction.commit()

        return { 
            notificationIds: notificationViewUpdates.notificationIds,
            updatedViewStatus: notificationViewUpdates.isViewed
        }
    }
    
    catch(error){ 

        transaction.rollback()

        throw error
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

const userService = { 
    getUserData,
    getContacts,
	getUserNotifications,
    getInvites,
    deleteNotification,
    updateNotification,
	getDailyReport
}

export default userService;