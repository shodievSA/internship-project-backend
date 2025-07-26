import { DataTypes, Model, CreationOptional } from 'sequelize';
import ProjectMember from './projectMember';
import DailyAiReport from './dailyAiReport';
import Notification from './notification';
import Invite from './invites';
import sequelize from '../clients/sequelize';
import Project from './project';

export interface UserAttributes {
	id: number;
	googleId: string | null;
	email: string;
	fullName: string | null;
	avatarUrl: string | null;
	accessToken: string | null;
	refreshToken: string | null;
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
	Invites: Invite[];
	projects: Project[];
}

class User extends Model<
	UserAttributes, UserCreationAttributes
> implements UserAttributes {
	declare id: CreationOptional<number>;
	declare googleId: string | null;
	declare email: string;
	declare fullName: string | null;
	declare avatarUrl: CreationOptional<string | null>;
	declare accessToken: string | null;
	declare refreshToken: string | null;
	declare isInvited: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	declare projectMember: ProjectMember;
	declare projectMembers: ProjectMember[];
	declare dailyAiReport: DailyAiReport[];
	declare notifications: Notification[];
	declare Invites: Invite[];
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
			type: DataTypes.STRING(2048),
			allowNull: true
		},
		refreshToken: {
			type: DataTypes.STRING(2048),
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
