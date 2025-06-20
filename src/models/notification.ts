import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import User from './user';

const notificationTypeEnum = [
  'invite',
  'new task',
  'task review',
  'task rejection',
  'task approval',
  'comment',
  'task update',
] as const;

interface NotificationAttributes {
  id: number;
  message: string;
  type: (typeof notificationTypeEnum)[number];
  priority: 'low' | 'middle' | 'high';
  isViewed: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface NotificationAssociations {
  User?: User;
}
class Notification extends Model<
  InferAttributes<Notification, { omit: keyof NotificationAssociations }>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<number>;
  declare message: string;
  declare type: (typeof notificationTypeEnum)[number];
  declare priority: 'low' | 'middle' | 'high';
  declare isViewed: CreationOptional<boolean>;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare User?: User;
}

Notification.init(
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
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
  }
);

export default Notification;
