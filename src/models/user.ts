import { DataTypes, Model, CreationOptional } from 'sequelize';
import ProjectMember from './projectMember';
import DailyAiReport from './dailyAiReport';
import Notification from './notification';
import ProjectInvitation from './projectInvitation';
import sequelize from '../clients/sequelize';
import Project from './project';

export interface UserAttributes {
	id: number;
	googleId: string;
	email: string;
	fullName: string;
	avatarUrl: string | null;
	accessToken: string;
	refreshToken: string;
	createdAt: Date;
	updatedAt: Date;
	isInvited: boolean;
}

export interface InvitedUserCreationAttributes {
	email: string;
	isInvited: true;
}

export interface RegisteredUserCreationAttributes {
	googleId: string;
	email: string;
	fullName: string;
	avatarUrl: CreationOptional<string | null>;
	accessToken: string;
	refreshToken: CreationOptional<string | null>;
	isInvited: CreationOptional<boolean>;
}

type UserCreationAttributes = InvitedUserCreationAttributes | RegisteredUserCreationAttributes;

export interface UserAssociations {
	projectMembers: ProjectMember[];
	projectMember: ProjectMember;
	dailyAiReport: DailyAiReport[];
	notifications: Notification[];
	projectInvitation: ProjectInvitation[];
	projects: Project[];
}

class User extends Model<
	UserAttributes, UserCreationAttributes
> implements UserAttributes {
	declare id: CreationOptional<number>;
	declare googleId: string;
	declare email: string;
	declare fullName: string;
	declare avatarUrl: CreationOptional<string | null>;
	declare accessToken: string;
	declare refreshToken: string;
	declare isInvited: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare projectMember: ProjectMember;
	declare projectMembers: ProjectMember[];
	declare dailyAiReport: DailyAiReport[];
	declare notifications: Notification[];
	declare projectInvitation: ProjectInvitation[];
	declare projects: Project[];
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
			allowNull: true
		},
		email: {
			type: DataTypes.STRING(320),
			allowNull: false,
			unique: true,
			validate: { isEmail: true }
		},
		fullName: {
			type: DataTypes.STRING(30),
			allowNull: true
		},
		avatarUrl: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		accessToken: {
			type: DataTypes.STRING(512),
			allowNull: true
		},
		refreshToken: {
			type: DataTypes.STRING(512),
			allowNull: true
		},
		isInvited: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
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
