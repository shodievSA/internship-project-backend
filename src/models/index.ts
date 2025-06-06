import User from './user';
import Project from './project';
import ProjectMember from './projectMember';
import Permission from './permission';
import Role from './role';
import RolePermission from './rolePermission';
import ProjectInvitation from './projectInvitation';
import Task from './task';
import Subtask from './subTask';
import DailyAiReport from './dailyAiReport';
import Comment from './comment';
import Notification from './notification';
import sequelize from '../clients/sequelize';
import { Sequelize } from 'sequelize';
import seedRoles from '../seed/seedRoles';
import seedRolePermissions from '../seed/seedRolePermissions';		
import seedPermissions from '../seed/seedPermissions';

export interface Models {
  User: typeof User;
  Project: typeof Project;
  ProjectMember: typeof ProjectMember;
  Permission: typeof Permission;
  Role: typeof Role;
  RolePermission: typeof RolePermission;
  ProjectInvitation: typeof ProjectInvitation;
  Task: typeof Task;
  Subtask: typeof Subtask;
  DailyAiReport: typeof DailyAiReport;
  Comment: typeof Comment;
  Notification: typeof Notification;
}
export let models: Models;
export const initAssociations = (sequelize: Sequelize) => {
  User.hasMany(ProjectMember, { foreignKey: 'user_id' });
  ProjectMember.belongsTo(User, { foreignKey: 'user_id' });

  Project.hasMany(ProjectMember, { foreignKey: 'project_id' });
  ProjectMember.belongsTo(Project, { foreignKey: 'project_id' });

  Role.hasMany(ProjectMember, { foreignKey: 'role_id' });
  ProjectMember.belongsTo(Role, { foreignKey: 'role_id' });

  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
  });

  Project.hasMany(ProjectInvitation, { foreignKey: 'project_id' });
  ProjectInvitation.belongsTo(Project, { foreignKey: 'project_id' });

  Project.hasMany(Task, { foreignKey: 'project_id' });
  Task.belongsTo(Project, { foreignKey: 'project_id' });

  ProjectMember.hasMany(Task, {
    foreignKey: 'assigned_by',
    as: 'assigned_tasks',
  });
  ProjectMember.hasMany(Task, {
    foreignKey: 'assigned_to',
  });
  Task.belongsTo(ProjectMember, {
    foreignKey: 'assigned_by',
  });
  Task.belongsTo(ProjectMember, {
    foreignKey: 'assigned_to',
  });

  Task.hasMany(Subtask, { foreignKey: 'task_id' });
  Subtask.belongsTo(Task, { foreignKey: 'task_id' });

  Task.hasMany(Comment, { foreignKey: 'task_id' });
  Comment.belongsTo(Task, { foreignKey: 'task_id' });

  ProjectMember.hasMany(Comment, { foreignKey: 'user_id' });
  Comment.belongsTo(ProjectMember, { foreignKey: 'user_id' });

  User.hasMany(DailyAiReport, { foreignKey: 'user_id' });
  DailyAiReport.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Notification, { foreignKey: 'user_id' });
  Notification.belongsTo(User, { foreignKey: 'user_id' });

  return {
    User,
    Project,
    ProjectMember,
    Permission,
    Role,
    RolePermission,
    ProjectInvitation,
    Task,
    Subtask,
    DailyAiReport,
    Comment,
    Notification,
  };
};

async function testSequelizeConnection() {
  try {
    await sequelize.authenticate();

    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export default async function testAndInitializeDatabase() {
	try {
		await testSequelizeConnection();

		await sequelize.sync({ force: true });
		models = initAssociations(sequelize)
		await seedRoles();
		await seedPermissions();
		await seedRolePermissions();

		console.log('Database synchronized successfully.');
	} catch (error) {
		console.error('Error synchronizing the database:', error);
	}
}