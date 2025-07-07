import sequelize from '../clients/sequelize';
import { Op } from 'sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { 
	FormattedProject, 
	ProjectDetails, 
	InviteType, 
	ProjectTask, 
	ProjectInvite, 
	AppError 
} from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import User from '@/models/user';
import Subtask from '@/models/subTask';
import TaskHistory from '@/models/taskHistory';
import Project from '@/models/project';
import { transporter } from '@/config/email';

class ProjectService {

	async leaveProject(projectId: number, userId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction(); 
			
		try {

			if (!projectId) throw new AppError(`No such project with an id - ${projectId}`);
			if (!userId) throw new AppError('User ID is required');

			const projectMember = await models.ProjectMember.findOne({
				where: { projectId, userId },
				transaction,
			});

			if (!projectMember) throw new AppError('Project member not found');

			const [user, project] = await Promise.all([
				models.User.findOne({ where: { id: userId }, attributes: ['fullName'], transaction }),
				models.Project.findOne({ where: { id: projectId }, attributes: ['title'], transaction })
			]);

			if (!user) throw new AppError(`No such user with id ${userId}`);
			if (!project) throw new AppError(`No such project with id ${projectId}`);

			const admin = await models.ProjectMember.findOne({
				where: {
					projectId: projectId,
					roleId: 1,
				},
				attributes: ['userId'],
				transaction,
			});

			if (!admin) throw new AppError(`No other admin to notify`);

			await projectMember.destroy({ transaction });

			await models.Notification.create({
				title: 'User left the project',
				message: `${user.fullName} left the project "${project.title}"`,
				userId: admin.userId,
			}, { transaction });

			await transaction.commit();

		} catch (error) {

			await transaction.rollback();
            throw error;

		}

	}

	async createProject(userId: number, title: string, position: string): Promise<object> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.create({ title }, { transaction });

            if (!project) { 
                throw new AppError('Failed creating project')
            }
		
			await models.ProjectMember.create(
				{
					userId: userId,
					projectId: project.id,
					position: position,
					roleId: 1,
				},
				{ transaction }
			);
		
			await transaction.commit();

			return project;

		} catch (error) {

            transaction.rollback();
            throw error;

		}

	}

	async inviteToProject(
		invitedBy: number,
		projectId: number,
		receiverEmail: string,
		positionOffered: string,
		roleOffered: 'manager' | 'member'
	): Promise<InviteType> {

		const transaction: Transaction = await sequelize.transaction();

		try {
			
			const userExists = await models.User.findOne({
				where: { email: receiverEmail }
			});

			if (userExists) {

				const userId = userExists.id;

				return createInvite(userId, invitedBy);

			} else {

				const newUser = await models.User.create({

					email: receiverEmail,
					isInvited: true,

				}, { transaction });

				if (newUser) {

					const userId = newUser.id;

					return createInvite(userId, invitedBy);

				}

				throw new AppError('Unexpected state: no user');

			}

			async function createInvite(userId: number, invitedBy: number): Promise<InviteType> {
				
				try {

					const [_, isCreated] = await models.Invite.findOrCreate({ 
						where: { 
							invitedUserId: userId,
							projectId: projectId,
							status: "pending"
						},
						defaults: {
							projectId: projectId,
							invitedUserId: userId,
							positionOffered: positionOffered,
							roleOffered: roleOffered,
							invitedBy: invitedBy
						},
						transaction
					});

                    if (!isCreated) { 
                        throw new AppError('The invite has already been send')
                    }

					const fullProdInvite = await models.Invite.findOne({
						where: { 
                            projectId: projectId,
                            invitedUserId : userId,
							status: "pending"
                         },
						include: [
							{
								model: models.Project,
								as: 'project',
                                attributes: ['title'],
							}, 

                            {
                                model : models.User,
                                as : 'user'
                            }
						],
						transaction
					});

					await transaction.commit();

					return { 
                        invite:{
                            id : fullProdInvite?.id as number,
                            status : fullProdInvite?.status,
                            receiverName : fullProdInvite?.user.fullName,
                            receiverEmail: fullProdInvite?.user.email as string,
                            receiverAvatarUrl : fullProdInvite?.user.avatarUrl,
                            positionOffered : fullProdInvite?.positionOffered as string,
                            roleOffered : fullProdInvite?.roleOffered,
                            createdAt : fullProdInvite?.createdAt as Date,
                        },
                        project : { 
                            title : fullProdInvite?.project.title
                        }
                    };

				} catch (error) {

                    transaction.rollback();
                    throw error;
					
				}

			}

		} catch (error) {

            transaction.rollback();
            throw error;

		}

	}

	async sendEmail(
		receiverEmail: string,
		positionOffered: string,
		roleOffered: 'manager' | 'member',
		projectTitle: string
	): Promise<void> {

		await transporter.sendMail({
						
			to: receiverEmail,
			from: process.env.EMAIL,
			subject: '📬 Project invitation',
			html: `
				<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
				<h1 style="color: #007BFF;">You've been invited to a project!</h1>

				<h2 style="color: #333; font-size: 22px; margin-top: 20px;">
					${projectTitle}
				</h2>

				<p style="font-size: 16px;">
					<strong>Role:</strong> ${roleOffered}<br>
					<strong>Position:</strong> ${positionOffered}
				</p>

				<a href="${process.env.FRONTEND_URL}/projects" style="
					display: inline-block;
					margin-top: 20px;
					padding: 10px 20px;
					background-color: #007BFF;
					color: white;
					text-decoration: none;
					border-radius: 5px;
					font-weight: bold;
				">
					Accept Invitation
				</a>

				</div>
			`
			
		});

	}

	async invitationStatus(inviteStatus: 'accepted' | 'rejected', inviteId: number): Promise<object> {
		
		const transaction: Transaction = await sequelize.transaction();

		try {
			const [count] = await models.Invite.update(

				{ status: inviteStatus },

				{
					where: { id: inviteId },
					transaction,
				}
				
			);

			if (count === 0) {
				throw new AppError('Project invitation not found');
			}

			const invite = await models.Invite.findByPk(inviteId, { transaction });

			if (!invite) {

				throw new AppError('Project invitation not found after update');

			}

			const { projectId, invitedUserId, positionOffered, roleOffered } = invite;

			const roleId = roleOffered === 'manager' ? 2 : 3;

			if (inviteStatus === 'accepted') {
				const newMember = await models.ProjectMember.create(

					{

						userId: invitedUserId,
						projectId,
						roleId,
						position: positionOffered,

					},

					{ transaction }

				);

				await transaction.commit();

				return {

					invitation: invite.toJSON(),
					newMember,

				};
			}

			if (inviteStatus === 'rejected') {

				await transaction.commit();

				return {

					invitation: invite.toJSON(),

				};
			}

			throw new AppError('Invalid status');

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

	}

	async changeTaskStatus(
		taskId: number,
		updatedTaskStatus: 'under review' | 'rejected' | 'closed',
		comment: string,
		fullname: string,
	): Promise<object> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const [affectedRows] = await models.Task.update(

				{ status: updatedTaskStatus },

				{

					where: { id: taskId },
					transaction,

				}

			);

			if (affectedRows === 0) {

				throw new AppError("Task not found");
				
			}

			const task = await models.Task.findOne({

				where: { id: taskId },

				include: [
					
					{
						model: models.Project,
						as: 'project',
						attributes: ['title']
					},

					{
						model: models.ProjectMember,
						as: 'assignedByMember',
						include: [{ model: models.User, as: 'user', attributes: ['id', 'fullName', 'avatarUrl'] }]
					},

					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						include: [{ model: models.User, as: 'user', attributes: ['id', 'fullName', 'avatarUrl'] }]
					},

					{
						model: models.Subtask,
						as: 'subtasks',
						attributes: {

							exclude: ['task_id']

						}
					},

					{
						model: models.TaskHistory,
						as: 'history',
						attributes: {

							exclude: ['task_id']
							
						}
					}

				],

				transaction

			}) as Task & {

				assignedByMember: ProjectMember & { user: User };
				assignedToMember: ProjectMember & { user: User };
				project: Project;
				subtasks: Subtask[];
				history: TaskHistory[];

			};

			const updatedTask = {

				id: task.id,
				title: task.title,
				description: task.description,
				priority: task.priority,
				deadline: task.deadline,
				createdAt: task.createdAt,
				assignedBy: {
					name: task.assignedByMember?.user?.fullName || null,
					avatarUrl: task.assignedByMember?.user?.avatarUrl || null,
					id: task.assignedByMember.id
				},
				assignedTo: {
					name: task.assignedToMember?.user?.fullName || null,
					avatarUrl: task.assignedToMember?.user?.avatarUrl || null,
					id: task.assignedToMember.id
				},
				status: task.status,
				subtasks: task.subtasks,
				history: task.history

			};

			let message: string;

			switch (updatedTaskStatus) {
				case 'under review':
					message = `${fullname} has submitted the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}" for your review.`;
					break;
				
				case 'rejected':
					message = `${fullname} has rejected the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}".`;
					break;

				case 'closed':
					message = `${fullname} has closed the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}".`;
					break;
			
				default:
					const _exhaustiveCheck: never = updatedTaskStatus;
					throw new AppError(`Unhandled task status: ${_exhaustiveCheck}`);
			}

			await models.Notification.create({ 

				title: 'Task submitted for review',
				message: message,
				userId: task.assignedByMember.user.id

			}, { transaction });

			await models.TaskHistory.create({ 

				taskId: taskId,
				status: updatedTaskStatus,
				comment,

			}, { transaction });

			await transaction.commit();

			return updatedTask;
			
		} catch (error) {

			await transaction.rollback();
			throw error;

		}

	}

	async getProjects(userId: number): Promise<FormattedProject[]> {

		const user = await models.User.findByPk(userId, {
			include: [{ 
				model: models.Project,
				as: 'projects'
			}],
			order: [[ 'createdAt', 'DESC' ]]
		});

		if (!user) {
			throw new AppError(`User not found.`);
		}

		const projects = user.projects as Project[];

		if (projects.length === 0) {

			return [];

		} else {

			const projectsWithStats = await Promise.all(
				projects.map(async (project: Project) => {

					const projectId = project.id;
		
					const [members, tasks, completedTasks, isAdmin] = await Promise.all([
						models.ProjectMember.count({ where: { projectId } }),
						models.Task.count({ where: { projectId } }),
						models.Task.count({ where: { projectId, status: 'closed' } }),
						models.ProjectMember.findOne({
							where: {
								projectId,
								userId,
								roleId: await models.Role.findOne({
									where: { name: 'admin' },
									attributes: ['id'],
								}).then((role) => role?.id),
							},
							raw: true,
						}).then((member) => !!member),
					]);
	
					return {
						id: project.id,
						title: project.title,
						status: project.status,
						createdAt: project.createdAt,
						members: members,
						totalTasks: tasks,
						totalTasksCompleted: completedTasks,
						isAdmin: isAdmin
					} as FormattedProject;

				})
			);

			return projectsWithStats;

		}

	}

	async updateProject(projectId: number, updatedFields: Partial<{
		title: string;
		status: 'active' | 'paused' | 'completed';
	}>): Promise<object> {

		try {
		
			const [count, affectedRows] = await models.Project.update(updatedFields, {

				where: { id: projectId },
				returning: true,

			});
		
			if (count === 0 || affectedRows.length === 0) {

				throw new AppError('Project not found');
				
			}
		
			return affectedRows[0].toJSON();

		} catch (error) {

            throw error;

		}

	}

	async deleteProject(projectId: number): Promise<void> {

		try {

			const deletedProjectCount = await models.Project.destroy({
				where: { id: projectId }
			});
		
			if (deletedProjectCount === 0) {
				throw new AppError('Project not found');
			}

		} catch (error) {

			throw error;

		}

	}

	async getProjectDetails(userId: number, projectId: number): Promise<ProjectDetails> { 

		try {

			const project = await models.Project.findByPk(projectId, {
				include: [{
					model: models.User,
					as: 'users',
					attributes: ['fullName', 'email', 'avatarUrl'],
					through: {
						as: 'projectMember',
						attributes: ['id', 'userId', 'position', 'roleId'],
					},
                }]
			});
            
			if (!project) throw new AppError(`Couldn't find project with id - ${projectId}`);
	
			const team = project.users.map((pm: User) => {

				const projectMember = pm.projectMember;

				return {
					id: projectMember.id as number,
					name: pm.fullName,
					email: pm.email,
                    avatarUrl: pm.avatarUrl,
					position: projectMember.position,
					role: projectMember.role as string
				}

			});
		
			const projectTasks = await models.Task.findAll({
				where: { projectId: projectId },
				include: [
					{
						model: models.ProjectMember,
						as: 'assignedByMember',
						include: [{ 
							model: models.User, 
                            as: 'user',
							attributes: ['fullName', 'avatarUrl'] 
						}],
						attributes: ['id']
					},
					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						include: [{ 
							model: models.User, 
                            as: 'user',
							attributes: ['fullName', 'avatarUrl'] 
						}],
						attributes: ['id']
					},
					{ 
						model: models.Subtask,
						as: 'subtasks'
					},
                    {
                        model: models.TaskHistory,
                        as: 'history',
                        separate: true,
                        order: [['created_at', 'DESC']]
                    }
				],
                order: [['created_at', 'DESC']]
			});

			const tasks: ProjectTask[] = [];

			for (const task of projectTasks) {

                tasks.push({
                    id: task.id as number,
                    title: task.title,
                    description: task.description as string,
                    priority: task.priority,
                    deadline: task.deadline,
                    subtasks: task.subtasks,
                    assignedBy: {
                        name: task.assignedByMember.user.fullName as string,
                        avatarUrl: task.assignedByMember.user.avatarUrl,
						id: task.assignedByMember.id
                    },
                    assignedTo: {
                        name: task.assignedToMember.user.fullName as string,
                        avatarUrl: task.assignedToMember.user.avatarUrl,
						id: task.assignedToMember.id
                    },
                    status: task.status,
                    history : task.history,
                    createdAt: task.createdAt
                });

			};
		
			const projectInvites = await models.Invite.findAll({
				where: { projectId },
				include: [{
					model: models.User,
					as: 'user'
				}],
                order: [['created_at', 'DESC']]
			});

			const invites: ProjectInvite[] = [];

			for (const invite of projectInvites) {

				invites.push({
					id: invite.id as number,
					status: invite.status,
					receiverEmail: invite.user.email,
					receiverName: invite.user.fullName,
					receiverAvatarUrl: invite.user.avatarUrl,
					createdAt: invite.createdAt as Date,
					positionOffered: invite.positionOffered as string,
					roleOffered: invite.roleOffered,
				});

			}

			const currentMember = await models.ProjectMember.findOne({
                where: { userId: userId },
                attributes: ['id']
            });

            if (!currentMember) throw new AppError(`Project member doesn't exist`);
	
			return {
				team: team,
				tasks: tasks,
				invites: invites,
				currentMemberId: currentMember.id
			} as ProjectDetails;

		} catch(err) {  

            throw err;

		}

	}

	async createTask(task: Task, userId: number): Promise<object> {

    	const transaction = await sequelize.transaction();

		try {

			const newTask = await models.Task.create(task, 
				{ transaction },
			);

			const assignedBy = await models.ProjectMember.findOne({
				where: { userId: userId },
				attributes: ['id'],
				include: [{
					model: models.User,
					as: 'user'
				}]
			});

			const assignedTo = await models.ProjectMember.findOne({
				where: { id: task.assignedTo },
				include: [{
					model: models.User,
					as: 'user'
				}]
			});

			let newTaskSubtasks: { id: number, title: string }[] = [];
            
			if (task.subtasks.length > 0) {

				const subtasks = await models.Subtask.bulkCreate(task.subtasks.map((subtask) => (
					{
						title: subtask.title,
						taskId: newTask.id,
					}
				)), { transaction });

				newTaskSubtasks = subtasks;

			} else {

				newTaskSubtasks = [];

			}

			const history = await models.TaskHistory.create(
				{
					taskId: newTask.id,
					status: newTask.status,
            	}, 
				{ transaction }
			);

			let newTaskHistory = [history];

			 const project = await models.Project.findOne({
				where: { id: task.projectId },
				attributes: ['title']
            });
            
            await models.Notification.create(
				{
					title: "New Task",
					message: `Project: ${project?.title}\nAssigned new task!`,
					userId: userId
            	},
				{ transaction }
			);

			await transaction.commit();

			const formattedNewTask = {
				deadline: newTask.deadline,
				createdAt: newTask.createdAt,
				description: newTask.description,
				id: newTask.id,
				priority: newTask.priority,
				status: newTask.status,
				title: newTask.title,
				assignedBy: {
					id: assignedBy?.id,
					name: assignedBy?.user.fullName,
					avatarUrl: assignedBy?.user.avatarUrl
				},
				assignedTo: {
					id: assignedTo?.id,
					name: assignedTo?.user.fullName,
					avatarUrl: assignedTo?.user.avatarUrl
				},
				history: newTaskHistory,
				subtasks: newTaskSubtasks
			} as ProjectTask;

			return formattedNewTask;

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

  	}

	async updateTeamMemberRole(projectId: number, memberId: number, newRole: string): Promise<ProjectMember> {

		try {

			if (!projectId) { throw new AppError('Project ID is required') };
			if (!memberId) { throw new AppError('Member ID is required') };
		
			const project = await models.Project.findByPk(projectId);
			if (!project) throw new AppError('Project not found');
			const member = await models.ProjectMember.findByPk(memberId);
			if (!member) throw new AppError('Team member not found');
		
			const role = await models.Role.findOne({ where: { name: newRole }});
		
			const [count, rows] = await models.ProjectMember.update(
				{ roleId:  role?.id},
				{ where: { id: memberId, projectId: projectId}, returning: true }
			);
		
			if (count === 0 || rows.length === 0) {
				throw new Error('Failed to update team member role');
			}
			
			return rows[0].toJSON() as ProjectMember;

		} catch (error) {

            throw error;

		}

	}

	async removeTeamMember(projectId: number, memberId: number, userId: number): Promise<void> {

		if (!projectId) throw new AppError('Project ID is required');
		if (!memberId) throw new AppError('Member ID is required');
		if (!userId) throw new AppError("User id ID is required");

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.findOne({
				where: { id: projectId },
				attributes: ['title']
			});

			const userToRemove = await models.ProjectMember.findOne({
				where: { id: memberId },
				include: [{
					model: models.User,
					attributes: ["id"],
					as: "user"
				}],
				transaction
			});

			if (!userToRemove) throw new Error("User not found");

			if (!project) throw new AppError(`Project with id - ${projectId} does not exist`);
			
			await models.ProjectMember.destroy({
				where: { id: memberId, projectId: projectId },
				transaction,
			});

			await models.Notification.create({
				title: 'Removed from project',
				message: `You have been removed from the project - "${project.title}".`,
				userId: userToRemove.user.id,
			}, { transaction });

			await transaction.commit();

		} catch (error) {

			await transaction.rollback();
			throw error;
			
		}
	}

    async deleteTask(userId: number, projectId: number, taskId: number): Promise<void> {

        try {

			const assignedBy = await models.ProjectMember.findOne({
				where: { userId: userId },
				attributes: ['id']
			});

			if (!assignedBy) throw new Error("");

            const isDeleted = await models.Task.destroy({
                where : { 
                    id: taskId,
                    projectId: projectId,
                    assignedBy: assignedBy.id
                }
            });
    
            if (!isDeleted) { 
                throw new AppError('Failed to delete or no such task');
            }

        } catch(error) {

            throw error;

        }

    }
}

export default new ProjectService();