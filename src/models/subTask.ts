import sequelize from '../clients/sequelize';
import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from 'sequelize';
import Task from './task';

export interface SubtaskAssociations {
  	Task?: Task;
}

class Subtask extends Model<
	InferAttributes<Subtask, { omit: keyof SubtaskAssociations }>,
	InferCreationAttributes<Subtask>
> {
	declare id: CreationOptional<number>;
	declare title: string;
	declare taskId: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare Task?: Task;
}

Subtask.init(
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
		taskId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'tasks',
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

export default Subtask;
