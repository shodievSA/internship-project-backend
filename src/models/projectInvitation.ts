import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional
} from 'sequelize';
import Project from './project';
import User from './user';

export interface ProjectInvitationAssociations {
	project: Project;
	receiver: User;
}

class ProjectInvitation extends Model<
	InferAttributes<ProjectInvitation, { omit: keyof ProjectInvitationAssociations }>,
	InferCreationAttributes<ProjectInvitation, { omit: keyof ProjectInvitationAssociations }>
> {
	declare id: CreationOptional<number>;
	declare projectId: number;
	declare status: 'pending' | 'accepted' | 'rejected';
	declare receiverEmail: string;
	declare receiverName: string;
	declare receiverAvatarUrl: CreationOptional<string | null>;
	declare positionOffered: string;
	declare roleOffered: 'manager' | 'member';
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare project: Project;
	declare receiver: User;
}

ProjectInvitation.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		projectId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'projects',
				key: 'id'
			}
		},
		status: {
			type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
			allowNull: false,
			defaultValue: 'pending'
		},
		receiverEmail: {
			type: DataTypes.STRING(320),
			allowNull: false,
			validate: {
				isEmail: true,
			}
		},
		receiverName: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		receiverAvatarUrl: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		positionOffered: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		roleOffered: {
			type: DataTypes.ENUM('manager', 'member'),
			allowNull: false
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

export default ProjectInvitation;
