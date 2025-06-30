import { models } from '../models';
import { FrontInvite, UserData } from '@/types';
import { decryptToken } from '../config/passport';
import { Contact, GooglePerson } from '@/types';
import Project from '@/models/project';
import User from '@/models/user';
import { auth, people } from 'googleapis/build/src/apis/people';

async function getUserData(userId: number): Promise<UserData | null> {

	try {

		const user = await models.User.findByPk(userId, {
			attributes: [
				'id',
				'email',
				'fullName',
				'avatarUrl',
				'createdAt',
			],
		});

		return user ? (user.toJSON() as UserData) : null;

	} catch (error) {

		console.error('Error fetching user data:', error);
		throw new Error('Internal server error' );
		
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

		console.log('Error getting contacts', error)
		throw new Error('Error getting contacts');
	}

}

async function getUserNotifications(userId: number): Promise<object> {
	
	try {

		const notifications = await models.Notification.findAll({

			where: {

				userId: userId

			},

			attributes: { exclude: ['user_id'] }

		});

		return notifications;
		
	} catch (error) {
		
		console.error(error);
		throw new Error("Internal server error");

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

        const invites : FrontInvite[] = rawInvites.map((record) => ({
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
        }));

        return invites;

    } catch(error) { 

		console.log('Error getting notifications', error);
		throw new Error('Error getting notifications');

    }

}

const UserService = { 
    getUserData,
    getContacts,
	getUserNotifications,
    getInvites,
}

export default UserService;