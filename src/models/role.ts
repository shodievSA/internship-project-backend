import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.ENUM('admin', 'manager', 'member'),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  }
);

export default Role;
