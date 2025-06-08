import { models } from '../models';


class UserService {
  async getUserData(userId: string): Promise<any> {
    try {
			const user = await models.User.findByPk(userId, {
        attributes: ['id', 'fullName', 'email', 'avatarUrl', 'phoneNumber', 'createdAt', 'updatedAt'],
      });
      
			if (!user) {
				return null;
			}

      return user;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Internal server error');
    }
  }
}

export default new UserService();