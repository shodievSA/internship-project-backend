import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import User from './user';
import Project from './project';

export interface NotificationAssociations {
  	user: User;
    project : Project;
}

class Notification extends Model<
	InferAttributes<Notification, { omit: keyof NotificationAssociations }>,
	InferCreationAttributes<Notification, { omit: keyof NotificationAssociations }>
> {
	declare id: CreationOptional<number>;
	declare title: string;
	declare message: string;
	declare isViewed: CreationOptional<boolean>;
	declare userId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare user: User;
    declare project : Project; 
}

Notification.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		isViewed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false	
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			}
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
		}
	},
	{
		sequelize,
		underscored: true,
	}
);

export default Notification;
