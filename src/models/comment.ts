import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';
import Task from './task';
import ProjectMember from './projectMember';

export interface CommentAssociations {
	task: Task;
	projectMember: ProjectMember;
}

class Comment extends Model<
	InferAttributes<Comment, { omit: keyof CommentAssociations }>,
	InferCreationAttributes<Comment, { omit: keyof CommentAssociations }>
> {
	declare id: CreationOptional<number>;
	declare message: string;
	declare taskId: number;
	declare projectMemberId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare task: Task;
	declare projectMember: ProjectMember;
}

Comment.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		taskId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'tasks',
				key: 'id'
			}
		},
		projectMemberId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'project_members',
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
		underscored: true,
	}
);

export default Comment;
