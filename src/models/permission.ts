import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

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
 const Permission = sequelize.define(
  'Permission',
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
  },
  {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
  }
);



export default Permission;
