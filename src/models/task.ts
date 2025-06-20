import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import Project from './project';
import ProjectMember from './projectMember';
import Subtask from './subTask';
import Comment from './comment';

interface TaskCreation {
  title: string;
  description: string;
  priority: 'low' | 'middle' | 'high';
  deadline: Date;
  assignedTo: number;
  assignedBy: number;
  projectId: number;
}
export interface TaskAssociations {
  Project?: Project;
  assignedByMember?: ProjectMember;
  assignedToMember?: ProjectMember;
  Subtasks?: Subtask[];
  Comments?: Comment[];
}

class Task extends Model<
  InferAttributes<Task, { omit: keyof TaskAssociations }>,
  TaskCreation
> {
  declare id: CreationOptional<number>;
  declare title: string | null;
  declare description: string;
  declare priority: 'low' | 'middle' | 'high';
  declare deadline: Date;
  declare assignedBy: number;
  declare assignedTo: number;
  declare status:
    | 'ongoing'
    | 'closed'
    | 'rejected'
    | 'under review'
    | 'overdue';
  declare completionNote: CreationOptional<string | null>;
  declare rejectionReason: CreationOptional<string | null>;
  declare approvalNote: CreationOptional<string | null>;
  declare projectId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare Project?: Project;
  declare assignedByMember?: ProjectMember;
  declare assignedToMember?: ProjectMember;
  declare Subtasks?: Subtask[];
  declare Comments?: Comment[];
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'middle', 'high'),
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_by',
      references: {
        model: 'project_members',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_to',
      references: {
        model: 'project_members',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
      defaultValue: 'ongoing',
    },
    completionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'completion_note',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    approvalNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'approval_note',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
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
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  }
);

export default Task;
