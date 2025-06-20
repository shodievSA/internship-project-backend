import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import ProjectMember from './projectMember';
import Permission from './permission';

interface RoleAttributes {
  id: number;
  name: 'admin' | 'manager' | 'member';
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssociations {
  ProjectMembers?: ProjectMember[];
  Permissions?: Permission[];
}

class Role extends Model<
  InferAttributes<Role, { omit: keyof RoleAssociations }>,
  InferCreationAttributes<Role>
> {
  declare id: CreationOptional<number>;
  declare name: 'admin' | 'manager' | 'member';
  declare description: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare ProjectMembers?: ProjectMember[];
  declare Permissions?: Permission[];
}

Role.init(
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
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  }
);

export default Role;
