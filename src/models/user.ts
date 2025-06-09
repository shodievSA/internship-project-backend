import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  fullName: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'full_name',
  },

  email: {
    type: DataTypes.STRING(320),
    allowNull: false,
    unique: true,
  },

  avatarUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'avatar_url',
  },

  googleId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'google_id',
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
    allowNull: false,
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
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User;