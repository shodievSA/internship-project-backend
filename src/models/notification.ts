import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import User from './user';

const notificationTypeEnum = [
	'invite',
	'new task',
	'task review',
	'task rejection',
	'task approval',
	'comment',
	'task update',
] as const;

export interface NotificationAssociations {
  	User?: User;
}

class Notification extends Model<
	InferAttributes<Notification, { omit: keyof NotificationAssociations }>,
	InferCreationAttributes<Notification>
> {
	declare id: CreationOptional<number>;
	declare message: string;
	declare type: (typeof notificationTypeEnum)[number];
	declare priority: 'low' | 'middle' | 'high';
	declare isViewed: CreationOptional<boolean>;
	declare userId: number;
	declare projectId: number | null;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare User?: User;
}

Notification.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM(...notificationTypeEnum),
			allowNull: false
		},
		priority: {
			type: DataTypes.ENUM('low', 'middle', 'high'),
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
		projectId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'projects',
				key: 'id'
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
