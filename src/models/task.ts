import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import Project from './project';
import ProjectMember from './projectMember';
import Subtask from './subTask';
import Comment from './comment';
import TaskHistory from './taskHistory';

export interface TaskAssociations {
	project: Project;
	assignedByMember: ProjectMember;
	assignedToMember: ProjectMember;
	subtasks: Subtask[];
	comments: Comment[];
    history: TaskHistory[];
} 

export interface TaskAttributes { 
	title: string;
	description: string;
	priority: 'low' | 'middle' | 'high';
	deadline: Date;
	assignedBy: number;
	assignedTo: number;
	status?: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
    subtasks?: string[];
	projectId: number;
}

class Task extends Model<
	InferAttributes<Task, { omit: keyof TaskAssociations }>,
	InferCreationAttributes<Task, { omit: keyof TaskAssociations }>
> {
	declare id: CreationOptional<number>;
	declare title: string;
	declare description: string;
	declare priority: 'low' | 'middle' | 'high';
	declare deadline: Date;
	declare assignedBy: number;
	declare assignedTo: number;
	declare status: CreationOptional<'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue'>;
	declare projectId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	declare project: Project;
	declare assignedByMember: ProjectMember;
	declare assignedToMember: ProjectMember;
	declare subtasks: Subtask[];
	declare comments: Comment[];
    declare history: TaskHistory[];
}

Task.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(50),
			allowNull: false,
			defaultValue: 'Untitled Task'
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		priority: {
			type: DataTypes.ENUM('low', 'middle', 'high'),
			allowNull: false
		},
		deadline: {
			type: DataTypes.DATE,
			allowNull: false
		},
		assignedBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'project_members',
				key: 'id'
			}
		},
		assignedTo: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'project_members',
				key: 'id'
			}
		},
		status: {
			type: DataTypes.ENUM(
				'ongoing',
				'closed',
				'rejected',
				'under review',
				'overdue'
			),
			allowNull: false,
			defaultValue: 'ongoing'
		},
		projectId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'projects',
				key: 'id'
			}
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

export default Task;
