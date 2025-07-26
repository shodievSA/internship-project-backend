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
import Task from './task';

export interface SprintAssociations {
	project: Project;
	createdByMember: ProjectMember;
    tasks: Task[],
    taskCount: number,
    closedTaskCount: number,
} 

export interface SprintAttributes { 
	title: string;
	description: string;
	status: 'planned' |'active' | 'completed' | 'overdue';
	projectId: number;
	createdBy: number;
    startDate: Date;
    endDate: Date;
    updatedAt: Date | string;
    createdAt: Date | string;
}

class Sprint extends Model<
	InferAttributes<Sprint, { omit: keyof SprintAssociations }>,
	InferCreationAttributes<Sprint, { omit: keyof SprintAssociations }>
> {
	declare id: CreationOptional<number>;
	declare title: string;
	declare description: CreationOptional<string>;
	declare status: CreationOptional<'planned' | 'active' | 'completed' | 'overdue'>;
	declare projectId: number;
	declare createdBy: number; // projectMemberId
    declare startDate: Date;
    declare endDate: Date;

	declare project: Project;
	declare createdByMember: ProjectMember;
    declare tasks?: Task[];
    declare taskCount?: number;
    declare closedTaskCount?: number
}

Sprint.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		createdBy: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'project_members',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		status: {
			type: DataTypes.ENUM(
                'planned',
				'active',
				'completed',
				'overdue',
			),
			allowNull: false,
			defaultValue: 'planned'
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
		startDate: {
			type: DataTypes.DATE,
			allowNull: false
		},		
        endDate: {
			type: DataTypes.DATE,
			allowNull: false
		},
	},
	{
		sequelize,
        timestamps:true,
		underscored: true
	}
);

export default Sprint;
