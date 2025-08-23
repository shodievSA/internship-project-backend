import { logger } from '@/config/logger';
import Permission from '../models/permission';

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
  'getProjectInvites'
];

export default async function seedPermissions() {

	try {

		for (const permission of permissionEnum) {
	
			await Permission.findOrCreate({ where: { name: permission } });
	
		}

		logger.info("permissions seeded successfully")

	} catch (err) {

		throw err;

	}

};