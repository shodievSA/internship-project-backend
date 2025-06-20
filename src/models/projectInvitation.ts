import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import Project from './project';
import User from './user';

interface ProjectInvitationAttributes {
  id: number;
  projectId: number;
  status: 'pending' | 'accepted' | 'rejected';
  receiverEmail: string;
  receiverName: string;
  receiverAvatarUrl: string | null;
  positionOffered: string | null;
  roleOffered: 'manager' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectInvitationAssociations {
  Project?: Project;
  receiver?: User;
}
class ProjectInvitation extends Model<
  InferAttributes<
    ProjectInvitation,
    { omit: keyof ProjectInvitationAssociations }
  >,
  InferCreationAttributes<ProjectInvitation>
> {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare status: 'pending' | 'accepted' | 'rejected';
  declare receiverEmail: string;
  declare receiverName: string;
  declare receiverAvatarUrl: CreationOptional<string | null>;
  declare positionOffered: CreationOptional<string | null>;
  declare roleOffered: 'manager' | 'member';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare Project?: Project;
  declare receiver?: User;
}

ProjectInvitation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    receiverEmail: {
      type: DataTypes.STRING(320),
      allowNull: false,
      field: 'receiver_email',
      validate: {
        isEmail: true,
      },
    },
    receiverName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'receiver_name',
    },
    receiverAvatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'receiver_avatar_url',
    },
    positionOffered: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'position_offered',
    },
    roleOffered: {
      type: DataTypes.ENUM('manager', 'member'),
      allowNull: false,
      field: 'role_offered',
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
    tableName: 'project_invitations',
    timestamps: true,
    underscored: true,
  }
);

export default ProjectInvitation;
