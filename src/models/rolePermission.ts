import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import sequelize from '../clients/sequelize';

interface RolePermissionAttributes {
  roleId: number;
  permissionId: number;
  createdAt: Date;
  updatedAt: Date;
}

class RolePermission extends Model<
  InferAttributes<RolePermission>,
  InferCreationAttributes<RolePermission>
> {
  declare roleId: number;
  declare permissionId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RolePermission.init(
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
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
  }
);

export default RolePermission;
