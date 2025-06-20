import RolePermission from '../models/rolePermission';
import RoleModel from '../models/role';
import PermissionModel from '../models/permission';

const rolePermissionPairs = [
  {
    roleName: 'admin',
    permissionName: [
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
    ],
  },

  {
    roleName: 'manager',
    permissionName: [
      'assignTasks',
      'editTasks',
      'deleteTasks',
      'makeComments',
      'leaveProject',
    ],
  },

  { roleName: 'member', permissionName: ['makeComments', 'leaveProject'] },
];

export default async function seedRolePermissions() {
  try {
    const rolesCount = await RoleModel.count();
    const permissionsCount = await PermissionModel.count();

    if (rolesCount === 0 || permissionsCount === 0) {
      throw new Error('Table roles or permissions empty');
    }

    for (const { roleName, permissionName } of rolePermissionPairs) {
      const role = await RoleModel.findOne({ where: { name: roleName } });

      if (!role) {
        console.warn(`Role not found: ${roleName}`);
        continue;
      }

      for (const permName of permissionName) {
        const permission = await PermissionModel.findOne({
          where: { name: permName },
        });

        if (!permission) {
          console.warn(`Permission not found: ${permName}`);
          continue;
        }

        let roleId = role.getDataValue('id');
        let permissionId = permission.getDataValue('id');

        if (!roleId || !permissionId) {
          console.warn(
            `Bad ID: roleId=${roleId}, permissionId=${permissionId}`
          );
          continue;
        }

        await RolePermission.findOrCreate({
          where: {
            roleId,
            permissionId,
          },
          defaults: {
            roleId,
            permissionId,
          },
        });
      }
    }

    console.log('RolePermissions seeded');
  } catch (error) {
    console.error('Error seeding RolePermissions:', error);
    throw error;
  }
}
