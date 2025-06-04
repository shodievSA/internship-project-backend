import sequelize from '../clients/sequelize';
import { DataTypes } from 'sequelize';

import RoleModel from './role';
import PermissionModel from './permission';

const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_permission',
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
}, {
  tableName: 'role_permissions',
  timestamps: true,
  underscored: true
});


const rolePermissionPairs = [
  { roleName: 'admin', permissionName: [
                                        'kickOutTeamMembers', 'invitePeople', 'deleteProject', 'assignTasks',
                                        'editTasks', 'deleteTasks', 'viewMemberProductivity', 'editProject',
                                        'promoteMembers', 'demoteMembers', 'editAnothersTasks', 'deleteAnothersTasks',
                                        'makeComments']},

 {roleName: 'manager', permissionName: ['assignTasks', 'editTasks', 'deleteTasks', 'makeComments', 'leaveProject']},
 {roleName: 'member', permissionName: ['makeComments', 'leaveProject']},
];

async function seedRolePermissions() {
  for (const { roleName, permissionName } of rolePermissionPairs) {
    const role = await RoleModel.findOne({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role not found: ${roleName}`);
      continue;
    }

    for (const permName of permissionName) {
      const permission = await PermissionModel.findOne({ where: { name: permName } });
      if (!permission) {
        console.warn(`Permission not found: ${permName}`);
        continue;
      }

      const roleId = role.getDataValue('id');
      const permissionId = permission.getDataValue('id');

      await RolePermission.findOrCreate({
        where: {
          roleId,
          permissionId,
        }
      });
    }
  }
  console.log('RolePermissions seeded');
}

sequelize.sync({ force: true }).then(() => {
  seedRolePermissions();
});

export default RolePermission;