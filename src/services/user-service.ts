import sequelize from '../clients/sequelize';
import { QueryTypes } from 'sequelize';
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
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Internal server error');
    }

    return 
  }
}
export default new UserService();
