import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import Task from './task';

interface SubtaskAttributes {
  id: number;
  title: string;
  taskId: number;
  createdAt: Date;
  updatedAt: Date;
}
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
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_id',
      references: {
        model: 'tasks',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'subtasks',
    timestamps: true,
    underscored: true,
  }
);

export default Subtask;
