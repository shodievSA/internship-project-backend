import sequelize from '../clients/sequelize';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import Role from './role';

const permissionEnum = [
  'kickOutTeamMembers',
  'invitePeople',
  'deleteProject',
  'assignTasks',
  'editTasks',
  'deleteTasks',
  'viewMemberProductivity',
  'editProject',
  'promoteMembers',
  'demoteMembers',
  'editAnotherTasks',
  'deleteAnotherTasks',
  'makeComments',
  'leaveProject',
];
interface PermissionAttributes {
  id: number;
  name: (typeof permissionEnum)[number];
  createdAt: Date;
  updatedAt: Date;
}
export interface PermissionAssociations {
  Roles?: Role[];
}

class Permission extends Model<
  InferAttributes<Permission, { omit: keyof PermissionAssociations }>,
  InferCreationAttributes<Permission>
> {
  declare id: CreationOptional<number>;
  declare name: (typeof permissionEnum)[number];
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare Roles?: Role[];
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.ENUM(...permissionEnum),
      allowNull: false,
      unique: true,
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
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
  }
);

export default Permission;
