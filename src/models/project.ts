import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import ProjectInvitation from './projectInvitation';
import ProjectMember from './projectMember';
import Task from './task';

export interface ProjectAttributes {
  id: number;
  title: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProjectAssociations {
  ProjectMembers?: ProjectMember[];
  ProjectInvitations?: ProjectInvitation[];
  Tasks?: Task[];
}

class Project extends Model<
  InferAttributes<Project, { omit: keyof ProjectAssociations }>,
  InferCreationAttributes<Project, { omit: keyof ProjectAssociations }>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare status: CreationOptional<'active' | 'completed' | 'paused' | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare ProjectMembers?: ProjectMember[];
  declare ProjectInvitations?: ProjectInvitation[];
  declare Tasks?: Task[];
}

Project.init(
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
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused'),
      allowNull: true,
      defaultValue: 'active',
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
    tableName: 'projects',
    timestamps: true,
    underscored: true,
  }
);

export default Project;
