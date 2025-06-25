import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import ProjectMember from './projectMember';
import Permission from './permission';

export interface RoleAssociations {
	projectMembers: ProjectMember[];
	permissions: Permission[];
}

class Role extends Model<
	InferAttributes<Role, { omit: keyof RoleAssociations }>,
	InferCreationAttributes<Role, { omit: keyof RoleAssociations }>
> {
	declare id: CreationOptional<number>;
	declare name: 'admin' | 'manager' | 'member';
	declare description: CreationOptional<string | null>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare projectMembers: ProjectMember[];
	declare permissions: Permission[];
}

Role.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.ENUM('admin', 'manager', 'member'),
			allowNull: false,
			unique: true
		},
		description: {
			type: DataTypes.STRING(255),
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

export default Role;
