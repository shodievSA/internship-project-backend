import sequelize from '../clients/sequelize';
import User from './user';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

interface ProjectMemberAttributes {
  id: number;
  userId: number;
  projectId: number;
  roleId: number;
  position: string;
  busyLevel: 'free' | 'low' | 'medium' | 'high';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface ProjectMemberAssociations {
  User?: User;
}

class ProjectMember extends Model<
  InferAttributes<ProjectMember, { omit: keyof ProjectMemberAssociations }>,
  InferCreationAttributes<ProjectMember>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare projectId: number;
  declare roleId: CreationOptional<number>;
  declare position: string;
  declare busyLevel: CreationOptional<'free' | 'low' | 'medium' | 'high'>;
  declare joinedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare User?: User;
}

ProjectMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    busyLevel: {
      type: DataTypes.ENUM('free', 'low', 'medium', 'high'),
      allowNull: true,
      field: 'busy_level',
      defaultValue: 'free',
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
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
    tableName: 'project_members',
    timestamps: true,
    underscored: true,
  }
);

export default ProjectMember;
