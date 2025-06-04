import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const notificationTypeEnum = [
  'invite',
  'new task',
  'task review',
  'task rejection',
  'task approval',
  'comment',
  'task update',
];

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  type: {
    type: DataTypes.ENUM(...notificationTypeEnum),
    allowNull: false,
  },

  priority: {
    type: DataTypes.ENUM('low', 'middle', 'high'),
    allowNull: false,
  },

  isViewed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_viewed',
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
}, {
  tableName: 'notifications',
  underscored: true,
  timestamps: true,
});

export default Notification;