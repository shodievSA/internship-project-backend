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

<<<<<<< HEAD
  accessToken: {
    type: DataTypes.STRING(512),
    allowNull: false,
    field: 'access_token',
  },

  refreshToken: {
    type: DataTypes.STRING(512),
    allowNull: false,
    field: 'refresh_token',
  },

=======
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998
  phoneNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'phone_number',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User;