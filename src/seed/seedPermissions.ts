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
  'getProjectInvites',
  'createSprints',
  'editSprints',
  'deleteSprints',
] as const satisfies string[];

export default async function seedPermissions() {
  for (const permission of permissionEnum) {
    await Permission.findOrCreate({ where: { name: permission } });
  }
};