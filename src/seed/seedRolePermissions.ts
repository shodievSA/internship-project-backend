import RolePermission from '../models/rolePermission';
import RoleModel from '../models/role';
import PermissionModel from '../models/permission';
import { logger } from '@/config/logger';

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
      'getProjectInvites',
      'createSprints',
      'editSprints',
      'deleteSprints',
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
      'createSprints',
      'editSprints',
      'deleteSprints',
      'viewMemberProductivity',
    ],
  },

  { roleName: 'member', permissionName: ['makeComments', 'leaveProject'] },
] as const satisfies object[];

export default async function seedRolePermissions() {

	try {

		const rolesCount = await RoleModel.count();
		const permissionsCount = await PermissionModel.count();

		if (rolesCount === 0 || permissionsCount === 0) {

			throw new Error("table 'roles' or 'permissions' is empty");

		}

		for (const { roleName, permissionName } of rolePermissionPairs) {

			const role = await RoleModel.findOne({ where: { name: roleName } });

			if (!role) {

				logger.warn(
					`The following role wasn't found in table 'roles' while seeding 'role_permissions' table: ${roleName}`
				);

				continue;

			}

			for (const permName of permissionName) {

				const permission = await PermissionModel.findOne({
					where: { name: permName },
				});

				if (!permission) {
					
					logger.warn(
						`The following permission wasn't found in table 'permissions' while seeding 'role_permissions' table: ${permName}`
					);

					continue;

				}

				let roleId = role.getDataValue('id');
				let permissionId = permission.getDataValue('id');

				if (!roleId || !permissionId) {

					logger.warn(
						`Bad id: role id: ${roleId}, permission id: ${permissionId}`
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

		logger.info('roles and permissions seeded successfully');

	} catch (err) {

		throw err;

	}

}
