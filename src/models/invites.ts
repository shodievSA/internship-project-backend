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

export interface InviteAssociations {
	project: Project;
	user: User;
	inviter: User;
}

class Invite extends Model<
	InferAttributes<Invite, { omit: keyof InviteAssociations }>,
	InferCreationAttributes<Invite, { omit: keyof InviteAssociations }>
> {
	declare id: CreationOptional<number>;
	declare projectId: number;
	declare invitedUserId: number;
	declare invitedBy: number;
	declare status: CreationOptional<'pending' | 'accepted' | 'rejected'>;
	declare positionOffered: string;
	declare roleOffered: 'manager' | 'member';
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare project: Project;
	declare user: User;
	declare inviter: User;
}

Invite.init(
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
			},
			onDelete: 'CASCADE'
		},
		invitedUserId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			}
		},
		invitedBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			}
		},
		status: {
			type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
			allowNull: false,
			defaultValue: 'pending'
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

export default Invite;
