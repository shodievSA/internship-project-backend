import sequelize from '../config/sequelize';
import {
	DataTypes, 
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';
import Invite from './invites';
import ProjectMember from './projectMember';
import Task from './task';
import User from './user';
import Sprint from './sprint';
import { HasManyGetAssociationsMixin } from 'sequelize';

export interface ProjectAssociations {
	projectMember: ProjectMember[];
	invites: Invite[];
	tasks: Task[];
	users: User[];
    sprints: Sprint[];
}

class Project extends Model<
	InferAttributes<Project, { omit: keyof ProjectAssociations }>,
	InferCreationAttributes<Project, { omit: keyof ProjectAssociations }>
> {
	declare id: CreationOptional<number>;
	declare title: string;
	declare status: CreationOptional<'active' | 'completed' | 'paused'>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
    
	declare projectMember: ProjectMember[];
	declare invites: Invite[];
	declare tasks: Task[];
	declare users: User[];
    declare sprints: Sprint[];

	declare getTasks: HasManyGetAssociationsMixin<Task>;
}
 
Project.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(50),
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [1, 50],
			}
		},
		status: {
			type: DataTypes.ENUM('active', 'completed', 'paused'),
			allowNull: false,
			defaultValue: 'active'
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
		underscored: true,
	}
);

export default Project;
