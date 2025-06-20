import {
  DataTypes,
  Model,
  Sequelize,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import ProjectMember from './projectMember';
import DailyAiReport from './dailyAiReport';
import Notification from './notification';
import ProjectInvitation from './projectInvitation';
import sequelize from '../clients/sequelize';

export interface UserAttributes {
  id: number;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  phoneNumber: string | null;
  tokenExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAssociations {
  ProjectMembers?: ProjectMember[];
  DailyAiReport?: DailyAiReport[];
  Notifications?: Notification[];
  ProjectInvitation?: ProjectInvitation[];
}

class User extends Model<
  InferAttributes<User, { omit: keyof UserAssociations }>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare googleId: string;
  declare email: string;
  declare fullName: string;
  declare avatarUrl: CreationOptional<string | null>;
  declare accessToken: string;
  declare refreshToken: CreationOptional<string | null>;
  declare phoneNumber: CreationOptional<string | null>;
  declare tokenExpiresAt: CreationOptional<Date | null>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare ProjectMembers?: ProjectMember[];
  declare DailyAiReport?: DailyAiReport[];
  declare Notifications?: Notification[];
  declare ProjectInvitation?: ProjectInvitation[];
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'google_id',
    },
    email: {
      type: DataTypes.STRING(320),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    fullName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'full_name',
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'avatar_url',
    },
    accessToken: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'access_token',
    },
    refreshToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'refresh_token',
    },
    phoneNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'phone_number',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'token_expires_at',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
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
  { sequelize, tableName: 'users', timestamps: true, underscored: true }
);

export default User;
