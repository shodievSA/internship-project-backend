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
export const models: Models = {
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

export const initAssociations = (sequelize: Sequelize) => {
  User.hasMany(ProjectMember, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  ProjectMember.belongsTo(User, {
    foreignKey: 'user_id',
  });

  User.hasMany(DailyAiReport, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  DailyAiReport.belongsTo(User, {
    foreignKey: 'user_id',
  });

  User.hasMany(Notification, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Notification.belongsTo(User, {
    foreignKey: 'user_id',
  });

  Project.hasMany(ProjectMember, {
    foreignKey: 'project_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  ProjectMember.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  Project.hasMany(ProjectInvitation, {
    foreignKey: 'project_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  ProjectInvitation.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  Project.hasMany(Task, {
    foreignKey: 'project_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Task.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  ProjectMember.hasMany(Comment, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Comment.belongsTo(ProjectMember, {
    foreignKey: 'user_id',
  });

  ProjectMember.hasMany(Task, {
    as: 'assignedByMember',
    foreignKey: 'assigned_by',
    onDelete: 'SET NULL',
  });
  Task.belongsTo(ProjectMember, {
    as: 'assignedByMember',
    foreignKey: 'assigned_by',
  });

  ProjectMember.hasMany(Task, {
    as: 'assignedToMember',
    foreignKey: 'assigned_to',
    onDelete: 'SET NULL',
  });
  Task.belongsTo(ProjectMember, {
    as: 'assignedToMember',
    foreignKey: 'assigned_to',
  });

  Role.hasMany(ProjectMember, {
    foreignKey: 'role_id',
    onDelete: 'SET NULL',
    hooks: false,
  });
  ProjectMember.belongsTo(Role, {
    foreignKey: 'role_id',
  });

  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  Task.hasMany(Subtask, {
    foreignKey: 'task_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Subtask.belongsTo(Task, {
    foreignKey: 'task_id',
  });

  Task.hasMany(Comment, {
    foreignKey: 'task_id',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Comment.belongsTo(Task, {
    foreignKey: 'task_id',
  });
  //
  ProjectInvitation.belongsTo(User, {
    as: 'receiver',
    foreignKey: 'receiver_email', // receiver_id
    targetKey: 'email', // id
  });
  //
  User.hasMany(ProjectInvitation, {
    foreignKey: 'receiver_email',
    as: 'receivedInvitations',
  });
};

export default async function testAndInitializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    initAssociations(sequelize);
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing the database:', error);
  }
}
