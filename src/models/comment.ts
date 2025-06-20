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

interface CommentAttributes {
  id: number;
  message: string;
  taskId: number;
  memberId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentAssociations {
  Task?: Task;
  ProjectMember?: ProjectMember;
}

class Comment extends Model<
  InferAttributes<Comment, { omit: keyof CommentAssociations }>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<number>;
  declare message: string;
  declare taskId: number;
  declare memberId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare Task?: Task;
  declare ProjectMember?: ProjectMember;
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
      field: 'task_id',
      references: {
        model: 'tasks',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'member_id',
      references: {
        model: 'project_members',
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
    tableName: 'comments',
    timestamps: true,
    underscored: true,
  }
);

export default Comment;
