import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

const RolePermission = sequelize.define(
  'RolePermission',
  {
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },

    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
  }
);

export default RolePermission;