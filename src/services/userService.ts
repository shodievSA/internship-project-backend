import { models } from '../models';
import { UserData } from '@/types';
import { decryptToken } from '../config/passport';
import { google } from 'googleapis';
import { Contact, GooglePerson } from '@/types';


	async function getUserData(userId: number): Promise<UserData | null> {

		try {

			const user = await models.User.findByPk(userId, {
				attributes: [
				'id',
				'email',
				'fullName',
				'avatarUrl',
				'createdAt',
				'lastLoginAt',
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
                attributes : ['refreshToken'],
                });

                const refreshToken = decryptToken(user?.refreshToken!);

                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID!,
                    process.env.GOOGLE_CLIENT_SECRET!,
                    `${process.env.BASE_URL}/api/v1/auth/google/callback`
                );

                oauth2Client.setCredentials({ refresh_token: refreshToken });

                const peopleAPI = google.people({ version: 'v1', auth: oauth2Client });

                let allConnections : Contact[] = []
                let nextPageToken : string | undefined = undefined ; 

                do {
                    const response : any = await peopleAPI.people.connections.list({
                        resourceName: 'people/me',
                        pageSize: 100,
                        personFields: 'names,emailAddresses,photos',
                        pageToken : nextPageToken,
                    });

                    const connections: GooglePerson[] = response.data.connections || []
                    const mapped = connections.map((person) => ({
                        email : person.emailAddresses[0].value,
                        fullName : person.names[0].displayName,
                        avatarUrl : person.photos?.[0].url ?? '',
                    }));
                    
                    allConnections = allConnections.concat(mapped);
                    nextPageToken = response.data.nextPageToken; 

                } while (nextPageToken);

                return allConnections
            }

        catch(error) { 

            console.log('Error getting contacts', error)
            throw new Error('Error getting contacts');
        }
    }

const UserService = { 
    getUserData,
    getContacts,
}

export default UserService;