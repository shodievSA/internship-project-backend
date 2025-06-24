import {
  DataTypes,
  Model,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import ProjectMember from './projectMember';
import DailyAiReport from './dailyAiReport';
import Notification from './notification';
import ProjectInvitation from './projectInvitation';
import sequelize from '../clients/sequelize';

export interface UserAttributes {
	id: number;
	googleId: string;
	email: string;
	fullName: string;
	avatarUrl: string | null;
	accessToken: string;
	refreshToken: string | null;
	phoneNumber: string | null;
	tokenExpiresAt: Date | null;
	lastLoginAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserAssociations {
	ProjectMembers: ProjectMember[];
	DailyAiReport: DailyAiReport[];
	Notifications: Notification[];
	ProjectInvitation: ProjectInvitation[];
}

class User extends Model<
	InferAttributes<User, { omit: keyof UserAssociations }>,
	InferCreationAttributes<User, { omit: keyof UserAssociations }>
> {
	declare id: CreationOptional<number>;
	declare googleId: string;
	declare email: string;
	declare fullName: string;
	declare avatarUrl: CreationOptional<string | null>;
	declare accessToken: string;
	declare refreshToken: CreationOptional<string | null>;
	declare phoneNumber: CreationOptional<string | null>;
	declare tokenExpiresAt: CreationOptional<Date | null>;
	declare lastLoginAt: CreationOptional<Date | null>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare ProjectMembers: ProjectMember[];
	declare DailyAiReport: DailyAiReport[];
	declare Notifications: Notification[];
	declare ProjectInvitation: ProjectInvitation[];
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		googleId: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		email: {
			type: DataTypes.STRING(320),
			allowNull: false,
			unique: true,
			validate: { isEmail: true }
		},
		fullName: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		avatarUrl: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		accessToken: {
			type: DataTypes.STRING(512),
			allowNull: false
		},
		refreshToken: {
			type: DataTypes.STRING(512),
			allowNull: true
		},
		phoneNumber: {
			type: DataTypes.STRING(30),
			allowNull: true
		},
		tokenExpiresAt: {
			type: DataTypes.DATE,
			allowNull: true
		},
		lastLoginAt: {
			type: DataTypes.DATE,
			allowNull: true
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	},
	{ 
		sequelize, 
		underscored: true 
	}
);

export default User;
