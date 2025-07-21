import User from './user'; 
import Project from './project';
import ProjectMember from './projectMember';
import Permission from './permission';
import Role from './role';
import RolePermission from './rolePermission';
import Task from './task';
import DailyAiReport from './dailyAiReport';
import Comment from './comment';
import Notification from './notification';
import sequelize from '../clients/sequelize';
import seedRoles from '../seed/seedRoles';
import seedRolePermissions from '../seed/seedRolePermissions';
import seedPermissions from '../seed/seedPermissions';
import TaskHistory from './taskHistory';
import Invite from './invites';
import TaskFiles from './taskFiles';

export interface Models {
	User: typeof User;
	Project: typeof Project;
	ProjectMember: typeof ProjectMember;
	Permission: typeof Permission;
	Role: typeof Role;
	RolePermission: typeof RolePermission;
	Invite: typeof Invite;
	Task: typeof Task;
	DailyAiReport: typeof DailyAiReport;
	Comment: typeof Comment;
	Notification: typeof Notification;
    TaskHistory : typeof TaskHistory;
	TaskFiles: typeof TaskFiles;
};

export const models: Models = {
	User,
	Project,
	ProjectMember,
	Permission,
	Role,
	RolePermission,
	Invite,
	Task,
	DailyAiReport,
	Comment,
	Notification,
    TaskHistory,
	TaskFiles,
};

export function initAssociations() {

	User.belongsToMany(Project, {
		through: { model: ProjectMember },
		as: 'projects',
		foreignKey: 'user_id',
		otherKey: 'project_id'
	});

	Project.belongsToMany(User, {
		through: { model: ProjectMember },
		as: 'users',
		foreignKey: 'project_id',
		otherKey: 'user_id'
	});

	User.hasMany(ProjectMember, {
		foreignKey: "user_id",
		as: "projectMembers"
	});

	ProjectMember.belongsTo(User, {
		foreignKey: 'user_id',
		as: 'user'
	});

	User.hasMany(DailyAiReport, {
		foreignKey: 'user_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	DailyAiReport.belongsTo(User, {
		foreignKey: 'user_id'
	});

	User.hasMany(Notification, {
		foreignKey: 'user_id',
		onDelete: 'CASCADE',
		hooks: true,
		as: "notifications"
	});

	Notification.belongsTo(User, {
		foreignKey: 'user_id'
	});

	Project.hasMany(Invite, {
		foreignKey: 'project_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Invite.belongsTo(Project, {
		foreignKey: 'project_id',
		as: 'project'
	});

	Invite.belongsTo(User, {
		foreignKey: 'invited_user_id',
		as: 'user'
	});

	Invite.belongsTo(User, {
		foreignKey: 'invited_by',
		as: 'inviter'
	});

	Project.hasMany(Task, {
		as: 'tasks',
		foreignKey: 'project_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Task.belongsTo(Project, {
		as: 'project',
		foreignKey: 'project_id'
	});

	ProjectMember.hasMany(Comment, {
		foreignKey: 'project_member_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Comment.belongsTo(ProjectMember, {
		foreignKey: 'project_member_id'
	});

	ProjectMember.hasMany(Task, {
		as: 'assignedByMember',
		foreignKey: 'assigned_by'
	});

	ProjectMember.hasMany(Task, {
		as: 'assignedToMember',
		foreignKey: 'assigned_to'
	});

	Task.belongsTo(ProjectMember, {
		as: 'assignedByMember',
		foreignKey: 'assigned_by'
	});

	Task.belongsTo(ProjectMember, {
		as: 'assignedToMember',
		foreignKey: 'assigned_to'
	});

	Role.hasMany(ProjectMember, {
		foreignKey: 'role_id',
		onDelete: 'SET NULL',
		hooks: false
	});

	ProjectMember.belongsTo(Role, {
		foreignKey: 'role_id'
	});

	Role.belongsToMany(Permission, {
		through: RolePermission,
		foreignKey: 'role_id',
		otherKey: 'permission_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Permission.belongsToMany(Role, {
		through: RolePermission,
		foreignKey: 'permission_id',
		otherKey: 'role_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Task.hasMany(Comment, {
		foreignKey: 'task_id',
		onDelete: 'CASCADE',
		hooks: true
	});

	Comment.belongsTo(Task, {
		foreignKey: 'task_id'
	});

    Task.hasMany(TaskHistory, {
        foreignKey : 'task_id',
        as : 'history',
        onDelete: 'CASCADE',
        hooks : true,
    });

    TaskHistory.belongsTo(Task, { 
        foreignKey : 'task_id',
        as : 'history',
    });

	Task.hasMany(TaskFiles, {
		foreignKey: 'taskId',
		as: 'taskFiles',
		onDelete: 'CASCADE',
	});

	TaskFiles.belongsTo(Task, {
		foreignKey: 'taskId',
		as: 'task',
	});
};

export default async function initDB() {

	try {

		await sequelize.authenticate();
		await sequelize.sync({ force: false });
		initAssociations();
		await seedRoles();
		await seedPermissions();
		await seedRolePermissions();

		console.log('Database synchronized successfully.');

	} catch (error) {

		console.error('Error synchronizing the database:', error);

	}

}
