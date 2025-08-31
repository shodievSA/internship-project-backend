import sequelize from '../config/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
    UpdateOptions
} from 'sequelize';
import Project from './project';
import ProjectMember from './projectMember';
import Comment from './comment';
import TaskHistory from './taskHistory';
import TaskFiles from './taskFiles';
import { models } from '.';
import { HasManyGetAssociationsMixin } from 'sequelize';

export interface TaskAssociations {
	project: Project;
	assignedByMember: ProjectMember;
	assignedToMember: ProjectMember;
	comments: Comment[];
    history: TaskHistory[];
	taskFiles: TaskFiles[];
}

export interface TaskAttributes { 
	title: string;
	description: string;
	priority: 'low' | 'middle' | 'high';
	deadline: Date | string;
	assignedBy: number;
	assignedTo: number;
	status?: 'ongoing' | 'closed' | 'rejected' | 'under review' | 'overdue';
	projectId: number;
    sprintId: number;
	createdAt?: Date | string;
    updatedAt?: Date | string;
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
    declare sprintId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	declare project: Project;
	declare assignedByMember: ProjectMember;
	declare assignedToMember: ProjectMember;
	declare comments: Comment[];
    declare history: TaskHistory[];
	declare taskFiles: TaskFiles[];

	declare getTaskFiles: HasManyGetAssociationsMixin<TaskFiles>;
}

Task.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(100),
			allowNull: false
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
			},
			onDelete: 'CASCADE'
		},
		assignedTo: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'project_members',
				key: 'id'
			},
			onDelete: 'CASCADE'
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
			},
			onDelete: "CASCADE"
		},
        sprintId:{
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { 
                model: 'sprints',
                key: 'id'
            },
            onDelete: "CASCADE"
        },
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
	},
	{   hooks: { 
            afterUpdate: async (task, options) => { 
                
                if ( task.previous("status") !== task.status) {
                    const comment = (options as UpdateOptions & { context: {comment?: string} })?.context.comment;

                    await models.TaskHistory.create(
                        { 
                        taskId: task.id,
                        status: task.status,
                        comment: comment
                        },
                        {transaction: options.transaction}
                    )
                }
            }
    },
		sequelize,
		underscored: true
	}
);

export default Task;
