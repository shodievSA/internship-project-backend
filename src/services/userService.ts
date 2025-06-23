import { models } from '../models';
import { UserData } from '@/types';

class UserService {

	async getUserData(userId: number): Promise<UserData | null> {

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
			throw new Error('Internal server error');
			
		}

	}

}

export default new UserService();