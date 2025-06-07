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
<<<<<<< HEAD
  'editAnothersTasks',
  'deleteAnothersTasks',
  'makeComments',
  'leaveProject',
];

const Permission = sequelize.define('Permission', {
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
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true
});


sequelize.sync().then(async () => {
  for (const permission of permissionEnum) {
    await Permission.findOrCreate({ where: { name: permission } });
  }
});

export default Permission;
=======
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
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998
