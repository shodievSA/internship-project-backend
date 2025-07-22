import sequelize from '../clients/sequelize';
import { models } from '../models';
import {Sequelize, Transaction} from 'sequelize';
import { 
	FormattedProject, 
	ProjectDetails, 
	InviteType, 
	ProjectTask, 
	ProjectInvite, 
	AppError, 
	TeamMember,
    FrontSprintAttributes,
    SprintMetaData
} from '@/types';
import ProjectMember from '@/models/projectMember';
import Task, { TaskAttributes } from '@/models/task';
import User from '@/models/user';
import TaskHistory from '@/models/taskHistory';
import { MemberProductivity } from '@/types'; 
import Project from '@/models/project';
import { GmailSenderFactory, GmailType } from '../services/gmaiService';

class ProjectService {

	async leaveProject(projectId: number, userId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction(); 
			
		try {

			const projectMember = await models.ProjectMember.findOne({
				where: { projectId, userId },
				attributes: ['id', 'roleId', 'position'],
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
				include: [{ model: models.User, as: 'user', attributes: ['email'] }],
				attributes: ['userId'],
				transaction,
			});

			if (!admin) throw new AppError(`No other admin to notify`);

			const userRole: string = projectMember.roleId === 2 ? 'manager' : 'member';
			const position: string = projectMember.position;

			await projectMember.destroy({ transaction });

			await models.Notification.create({
				title: 'User left the project',
				message: `${user.fullName} left the project "${project.title}"`,
				userId: admin.userId,
			}, { transaction });

			await transaction.commit();

			GmailSenderFactory.sendGmail(GmailType.LEAVE_PROJECT).sendGmail(
				admin.user.email,
				[project.title, userRole, position]
			).catch(err => {
				console.error('Failed to send email', err);
			});

		} catch (error) {

			await transaction.rollback();
            throw error;

		}

	}

	async createProject(userId: number, title: string, position: string): Promise<object> {
            
        if ( !title || !position ) { 
            
            throw new AppError("Title and Position fields can not be empty")
        }

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

            await transaction.rollback();
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

					GmailSenderFactory.sendGmail(GmailType.PROJECT_INVITE).sendGmail(
						receiverEmail,
						[fullProdInvite!.project.title, roleOffered, positionOffered]
					).catch(err => {
						console.error('Failed to send email', err);
					});

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
                        }
                    };

				} catch (error) {

                    await transaction.rollback();
                    throw error;
					
				}

			}

		} catch (error) {

            await transaction.rollback();
            throw error;

		}

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

			const invite = await models.Invite.findByPk(inviteId, { include: { model: models.User, as: 'inviter', attributes: ['email']}, transaction });

			if (!invite) {

				throw new AppError('Project invitation not found after update');

			}			

			const { projectId, invitedUserId, positionOffered, roleOffered } = invite;

			const [ user, project ] = await Promise.all(
				[
					models.User.findByPk(invitedUserId, { transaction }),
					models.Project.findByPk(projectId, { attributes: ['title'], transaction })
				]
			);

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

				await models.Notification.create({

					title: 'Project invitation accepted',
					message: `${user!.fullName} has joined the project!`,
					userId: invite.invitedBy

				}, { transaction });

				await transaction.commit();

				GmailSenderFactory.sendGmail(GmailType.PROJECT_INVITE_ACCEPT).sendGmail(
					invite.inviter.email,
					[project!.title, roleOffered, positionOffered, projectId]
				).catch(err => {
					console.error('Failed to send email', err);
				});

				return {

					invitation: invite.toJSON(),
					newMember,

				};
			}

			if (inviteStatus === 'rejected') {

				await transaction.commit();

				GmailSenderFactory.sendGmail(GmailType.PROJECT_INVITE_REJECT).sendGmail(
					invite.inviter.email,
					[project!.title, roleOffered, positionOffered, projectId]
				).catch(err => {
					console.error('Failed to send email', err);
				});

				return {

					invitation: invite.toJSON(),

				};
			}

			throw new AppError('Invalid status');

		} catch (error) {

			if (!(transaction as any).finished) await transaction.rollback();
			throw error;

		}

	}

	async changeTaskStatus(
		projectId: number,
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
						attributes: ['roleId', 'position'],
						include: [{ model: models.User, as: 'user', attributes: ['id', 'fullName', 'avatarUrl', 'email'] }]
					},

					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						attributes: ['roleId', 'position'],
						include: [{ model: models.User, as: 'user', attributes: ['id', 'fullName', 'avatarUrl', 'email'] }]
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
				history: task.history

			};

			let message, email, emailTitle, role, position, tasksType: string;
			let notificationReceiverId: number;

			switch (updatedTaskStatus) {
				case 'under review': 
					message = `${fullname} has submitted the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}" for your review.`;
					email = task.assignedByMember.user.email;
					emailTitle = `${task.assignedToMember.user.fullName} has submitted the task for review!`;
					notificationReceiverId = task.assignedByMember.user.id;
					role =
						task.assignedToMember.roleId === 2 ? 'manager' :
						task.assignedToMember.roleId === 3 ? 'member' :
						'admin';
					position = task.assignedToMember.position;
					tasksType = 'review-tasks';
					break;
				
				case 'rejected':
					message = `${fullname} has rejected the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}".`;
					email = task.assignedToMember.user.email;
					emailTitle = `${task.assignedByMember.user.fullName} has rejected your submission!`;
					notificationReceiverId = task.assignedToMember.user.id;
					role = task.assignedByMember.roleId === 2 ? 'manager' : 'admin'
					position = task.assignedByMember.position;
					tasksType = 'my-tasks';
					break;

				case 'closed':
					message = `${fullname} has closed the task "${task.title || 'Task title is not specified'}" in the project "${task.project.title}".`;
					email = task.assignedToMember.user.email;
					emailTitle = `${task.assignedByMember.user.fullName} has approved your submission!`;
					notificationReceiverId = task.assignedToMember.user.id;
					role = task.assignedByMember.roleId === 2 ? 'manager' : 'admin'
					position = task.assignedByMember.position;
					tasksType = 'my-tasks';
					break;
			
				default:
					const _exhaustiveCheck: never = updatedTaskStatus;
					throw new AppError(`Unhandled task status: ${_exhaustiveCheck}`);
			}

			await models.Notification.create({ 

				title: emailTitle,
				message: message,
				userId: notificationReceiverId

			}, { transaction });

			await models.TaskHistory.create({ 

				taskId: taskId,
				status: updatedTaskStatus,
				comment,

			}, { transaction });

			await transaction.commit();	

			GmailSenderFactory.sendGmail(GmailType.CHANGE_TASK_STATUS).sendGmail(
				email,
				[task.project.title, emailTitle, updatedTask.title, role, position, projectId, tasksType]
			).catch(err => {
				console.error('Failed to send email', err);
			});

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
				attributes: ['id', 'title', 'status', 'createdAt'],
                include: [{
                    model: models.Sprint,
                    as : 'sprints',
                    order: [["created_at", "ASC"]],
                    attributes: {
                        include: [ 
                            [
                                Sequelize.literal(`(
                                    SELECT COUNT (*)
                                    FROM tasks AS t 
                                    WHERE t.sprint_id = "sprints".id
                                    )`),
                                    'taskCount'
                            ],
                            [
                                Sequelize.literal(`(
                                    SELECT COUNT (*)
                                    FROM tasks AS t 
                                    WHERE t.sprint_id = "sprints".id AND t.status = 'closed'
                                    )`),
                                    'closedTaskCount'
                            ],
                        ]
                    },
                    include: [{
						model: models.ProjectMember,
						as: 'createdByMember',
						include: [{ 
							model: models.User, 
                            as: 'user',
							attributes: ['fullName', 'avatarUrl', 'email'] 
						}],
					}]
                }, 
                ]
			});
            
			if (!project) throw new AppError(`Couldn't find project with id - ${projectId}`);

			const metaData = {
				id: project.id,
				title: project.title,
				status: project.status,
				createdAt: project.createdAt
			};
		
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

			const currentMember = await models.ProjectMember.findOne({
                where: { 
					userId: userId, 
					projectId: projectId 
				},
                attributes: ['id', 'roleId']
            });

            if (!currentMember) throw new AppError(`Project member doesn't exist`);
            
            const sprints: SprintMetaData[] = [];

            for(const sprint of project.sprints) { 

                sprints.push({
                    id: sprint.id,
                    title: sprint.title,
                    description: sprint.description,
                    status: sprint.status,
                    projectId: sprint.projectId,
                    createdBy: {
                        fullName: sprint.createdByMember.user.fullName,
                        avatarUrl: sprint.createdByMember.user.avatarUrl,
                        email: sprint.createdByMember.user.email
                    },
                    closedTaskCount: Number(sprint.get('closedTaskCount')),
                    taskCount: Number(sprint.get('taskCount')),
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                })
            }
            const team = await this.getTeamOfProject(projectId)
            if (!team) {
                throw new AppError("Faced error while getting team")
            }
			return {
				metaData: metaData,
				tasks: tasks,
                sprints: sprints,
                team: team,
				currentMemberId: currentMember.id,
				currentMemberRole: currentMember.role as "admin" | "manager" | "member"
			};

		} catch(err) {  

            throw err;

		}

	}

	async createTask(task: Task, userId: number, projectId: number): Promise<object> {

    	const transaction = await sequelize.transaction();

		const deadline: Date = new Date(task.deadline);

		if (Number.isNaN(deadline.getTime())) {
			throw new AppError('Invalid deadline format', 400);
		}

		if (deadline.getTime() < Date.now()) {
			throw new AppError('Deadline cannot be in the past', 400);
		}

		try {

            const assignedBy = await models.ProjectMember.findOne({
                where: { userId: userId },
                attributes: ['id'],
                include: [{
                    model: models.User,
                    as: 'user'
                }],
                transaction
            });

            const assignedTo = await models.ProjectMember.findOne({
                where: { id: task.assignedTo },
                include: [{
                    model: models.User,
                    as: 'user'
				}],
                transaction
            })

            if (!assignedBy || !assignedTo) { 
                throw new AppError('No such users in project')
            }

			const newTask = await models.Task.create(task, 
				{ transaction },
			);

			const project = await models.Project.findByPk(task.projectId, {
				attributes: ['title']
			});
			const history = await models.TaskHistory.create(
				{
					taskId: newTask.id,
					status: newTask.status,
            	}, 
				{ transaction }
			);

			let newTaskHistory = [history];
            
            await models.Notification.create({
                title: "New Task",
                message: `Project: ${project?.title}.
                Assigned new task: ${task.title}`,
                userId: assignedTo.user.id,
            },{transaction})

			await transaction.commit();

			GmailSenderFactory.sendGmail(GmailType.NEW_TASK).sendGmail(
				assignedTo.user.email,
				[project!.title, newTask.title, projectId]
			).catch(err => {
				console.error('Failed to send email', err);
			});

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
			} as ProjectTask;

			return formattedNewTask;

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

  	}

	async updateTeamMemberRole(
		projectId: number, 
		memberId: number, 
		newRole: string
	): Promise<TeamMember> {

		try {

			if (!projectId) throw new AppError("project id is required");
			if (!memberId) throw new AppError("member id is required");
		
			const role = await models.Role.findOne({ where: { name: newRole }});

			if (!role) throw new AppError("invalid role");
		
			const [count] = await models.ProjectMember.update(
				{ roleId:  role.id },
				{ 
					where: { 
						id: memberId, 
						projectId: projectId
					},
					returning: true
				}
			);
		
			if (count === 0) throw new Error("failed to update team member role");

			const project = await models.Project.findByPk(projectId, {
				attributes: ['title']
			});

			try {

				const member = await models.ProjectMember.findByPk(memberId, {
					attributes: ["roleId", "position"],
					include: [
						{
							model: models.User,
							as: "user",
							attributes: ["id", "fullName", "email", "avatarUrl"]
						}
					]
				});

				await models.Notification.create({
					title: 'Team member role updated',
					message: `Your role in the project has been updated to ${newRole}.`,
					userId: member!.user.id,
				});

				GmailSenderFactory.sendGmail(GmailType.PROMOTE_DEMOTE_MEMBER).sendGmail(
					member!.user.email,
					[project!.title as string, newRole, projectId]
				).catch(err => {
					console.error('Failed to send email', err);
				});

				const projectMember = {
					id: memberId,
					name: member?.user.fullName,
					email: member?.user.email,
					avatarUrl: member?.user.avatarUrl,
					position: member?.position,
					role: member?.role
				} as TeamMember;
				
				return projectMember;

			} catch(err) {

				console.log(err);
				throw new AppError("");

			}

		} catch (error) {

            throw error;

		}

	}

	async removeTeamMember(
		projectId: number, 
		memberId: number, 
		userId: number
	): Promise<void> {

		if (!projectId) throw new AppError("Project ID is required");
		if (!memberId) throw new AppError("Member ID is required");
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
					attributes: ["id", "email"],
					as: "user"
				}],
				transaction
			});

			if (!userToRemove) throw new Error("User not found");
			if (!project) throw new AppError(`Project with id - ${projectId} does not exist`);

			const projectTitle: string = project.title;
			
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

			GmailSenderFactory.sendGmail(GmailType.REMOVE_TEAM_MEMBER).sendGmail(
				userToRemove.user.email,
				[projectTitle]
			).catch(err => {
				console.error('Failed to send email', err);
			});

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
                },
                force: true,
            });
    
            if (!isDeleted) { 
                throw new AppError('Failed to delete or no such task');
            }

        } catch(error) {

            throw error;

        }

    }

    async updateTask(
		projectId: number,
		taskId: number,
		updatedTaskProps: TaskAttributes
    ) : Promise<ProjectTask> {

        const transaction: Transaction = await sequelize.transaction();
        
         try {

             const task = await models.Task.findOne({
                where: { 
                    id: taskId, 
                    projectId: projectId,
                },
                include: [
					{
						model: models.Project, 
						as: 'project',
						attributes: ['title']
					},
                    {
                        model: models.ProjectMember,
                        as: 'assignedByMember',
                        include: [{ 
                            model: models.User, 
                            as: 'user',
                            attributes: ['fullName', 'avatarUrl', 'id'] 
                        }],
                        attributes: ['id']
                    },
                    {
                        model: models.ProjectMember,
                        as: 'assignedToMember',
                        include: [{ 
                            model: models.User, 
                            as: 'user',
                            attributes: ['fullName', 'avatarUrl', 'id', 'email'] 
                        }],
                        attributes: ['id']
                    },
                    {
                        model: models.TaskHistory,
                        as: 'history',
                        separate: true,
                        order: [['created_at', 'DESC']]
                    }
				], 
                    
                transaction,
                    
            });
                    
            if (!task) throw new AppError('Invalid task or project');

            if (updatedTaskProps.deadline) { 
                        
                const newDeadline = new Date(updatedTaskProps.deadline);
                        
				if (new Date(Date.now()) > newDeadline) {
					throw new AppError('Cannot assign past date!');
				}

				task.deadline = newDeadline;

            }

            if (
				updatedTaskProps.assignedBy 
				&& 
				task.assignedBy !== updatedTaskProps.assignedBy
			) { 
                throw new AppError('Cannot change property assignedBy');
            }

            if (
				updatedTaskProps.status 
				&& 
				(task.status !== updatedTaskProps.status || updatedTaskProps.projectId) 
				&& 
				task.projectId !== updatedTaskProps.projectId
			)  { 
                throw new AppError('Cannot change status of task or projectId');
            }

            let newAssignedUser: ProjectMember | null = null

            if (
				updatedTaskProps.assignedTo 
				&& 
				task.assignedTo !== updatedTaskProps.assignedTo
			)  {

                newAssignedUser = await models.ProjectMember.findOne({
                    where: {
                        id: updatedTaskProps.assignedTo,
                        projectId: projectId,
                    },
                    include : [{ 
                        model: models.User,
                        as: 'user',
                        attributes: ['id', 'fullName', 'email', 'avatarUrl']

                    }],
                    transaction
                });

                if (!newAssignedUser) { 
                    throw new AppError ('No such user to assign task');
                }

                await models.Notification.create({
                    
                    title: "Task reassigned",
                    message: `Your task: ${task.title} was removed from your tasks by authority`,
                    userId: task.assignedToMember.user.id,
                    },
                    {transaction}
                )

				GmailSenderFactory.sendGmail(GmailType.REASSIGN_TASK).sendGmail(
					task.assignedToMember.user.email,
					[task.project.title, task.title, projectId],
				).catch(err => {
					console.error('Failed to send email', err);
				});

                //change receiver
                task.assignedToMember.user = newAssignedUser.user

                await models.Notification.create({

                    title: "New Task",
                    userId: task.assignedToMember.user.id,
                    message: `Project: ${task.project.title}.
                    Assigned new task: "${task.title}"`,
                    },
                    {transaction}
                )

				GmailSenderFactory.sendGmail(GmailType.NEW_TASK).sendGmail(
					task.assignedToMember.user.email,
					[task.project.title, task.title, projectId]
				).catch(err => {
					console.error('Failed to send email', err);
				});

            } else { 

                await models.Notification.create({ 
                    title: "Task updated",
                    userId: task.assignedToMember.user.id,
                    message:`Project: ${task.project.title}.
                    Your task: ${task.title} was updated by authority`
                },
                    {transaction}
                )

				GmailSenderFactory.sendGmail(GmailType.UPDATED_TASK).sendGmail(
					task.assignedToMember.user.email,
					[task.project.title, task.title, projectId]
				).catch(err => {
					console.error('Failed to send email', err);
				});

            }

            await task.update(updatedTaskProps as Task, {transaction});

            await transaction.commit();

            return { 
                id: task.id,
                title: updatedTaskProps.title || task.title,
                description: updatedTaskProps.description || task.description,
                priority: updatedTaskProps.priority || task.priority,
                deadline: task.deadline,
                assignedBy: {
                    id: task.assignedByMember.id,
                    name: task.assignedByMember.user.fullName,
                    avatarUrl: task.assignedByMember.user.avatarUrl
                },
                assignedTo: { 
                    id: task.assignedToMember.id,
                    name: task.assignedToMember.user.fullName,
                    avatarUrl: task.assignedToMember.user.avatarUrl,
                },
                status: task.status,
                history: task.history,
                createdAt: task.createdAt 
            } as ProjectTask;

        } catch(error) {
            await transaction.rollback()
            throw error
        }      
        
    }

    async getMemberProductivity(projectId: number, memberId: number): Promise<MemberProductivity | null> {

        try {

            const member = await models.ProjectMember.findOne({
                where: { 
                    id: memberId,
                    projectId: projectId,
                },
                include: [{
                    model: models.User,
                    as : "user",
                    attributes: ["fullName"]
                }],
            })

            if (!member ) { 
                throw new AppError("No such member in this project")
            }

            let memberOngoingTasksCount = 0 ; 
            let memberCompletedTasksCount = 0 ; 
            let memberRejectedTasksCount = 0 ; 
            let memberUnderReviewTasksCount = 0 ; 
            let memberOverdueTasksCount = 0 ; 

            const memberTotalTasks = await models.Task.findAndCountAll({
                where: { 
                    projectId: projectId, 
                    assignedTo: member?.id,
                },
                order: [["created_at", "DESC"]],
            }) 
            if (!memberTotalTasks) { 
                throw new AppError("not tasks")
            }
            
            let totalTime: number = 0; 

            if (memberTotalTasks.count !== 0){

                for (const task of memberTotalTasks.rows) { 

                    totalTime += (new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime())/ (3_600_000); // (updateAt-createdAt) in hours
                    
                    switch (task.status) { 
                        case 'ongoing':
                            memberOngoingTasksCount+=1 ;
                            break;
                        case 'closed':
                            memberCompletedTasksCount+=1;
                            break
                        case 'rejected':
                            memberRejectedTasksCount+=1 ;
                            break ;
                        case 'under review':
                            memberUnderReviewTasksCount+=1 ;
                            break;
                        case'overdue':
                            memberOverdueTasksCount+=1 ;
                            break;      
                    }
                }
            }else { return null }

            const avgCompletionTimeInHours: number = memberCompletedTasksCount > 0 ? Number((totalTime / memberCompletedTasksCount).toFixed(1)) : 0;

            const completionRate: number = memberTotalTasks.count>0 ? memberCompletedTasksCount / memberTotalTasks.count : 0

            const productivityScore = Math.round(completionRate * 60 +
            (1-(avgCompletionTimeInHours/8)) * 20 + 
            (1-((memberOverdueTasksCount + memberRejectedTasksCount)/memberTotalTasks.count)) * 20) || 0

            const recentActivityRaw = await models.Task.findAll({
                where: { 
                    projectId: projectId, 
                    assignedTo: member?.id,
                },
                attributes : ["title", "status", "updatedAt"],
                order: [["updated_at", "DESC"]],
                limit: 5,
            })
            let result: MemberProductivity = { 
                 member: { 
                    fullName:  member?.user.fullName as string,
                    position: member?.position as string,
                    role: member?.role as string,
                },
                productivityScore: productivityScore,
                tasksCompleted: memberCompletedTasksCount,
                completionRate: completionRate,
                avgTimeForTask: avgCompletionTimeInHours,
                taskDistribution: { 
                    inProgress: memberOngoingTasksCount,
                    completed: memberCompletedTasksCount,
                    rejected: memberRejectedTasksCount,
                    underReview: memberUnderReviewTasksCount,
                    overdue: memberOverdueTasksCount,
                },
                recentActivity: []

            }
            for (const task of recentActivityRaw) { 
                const hoursSinceUpdate = Number(((Date.now() - new Date(task.updatedAt).getTime())/3_600_000).toFixed(1))
                result.recentActivity.push({
                    title:task.title,
                    status: task.status,
                    time: hoursSinceUpdate
                })
            }
            return result
        }
        catch(err) { 
            throw err
        }
    
    }

    async getProjectInvites(projectId: number): Promise<ProjectInvite[]> {
        
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

        return invites
    }

    async getTeamOfProject(projectId:number): Promise<TeamMember[]> {

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

            const team = project.users.map((projectN: User) => {

                return {
                    id: projectN.projectMember.id as number,
                    name: projectN.fullName,
                    email: projectN.email,
                    avatarUrl: projectN.avatarUrl,
                    position: projectN.projectMember.position,
                    role: projectN.projectMember.role as string
                }
            });

        return team
    }

    async createSprint(projectId: number, sprintInfo: FrontSprintAttributes ){
        
        const project = await models.Project.findByPk(projectId)
        const startDate = new Date(sprintInfo.startDate)
        const endDate = new Date(sprintInfo.endDate)
        if (!project) { 
            throw new AppError('Np such project')
        }

        if ( startDate.getTime() < (Date.now() - 24*60*60*1000) || endDate.getTime() < startDate.getTime() ) {
            throw new AppError('Incorrect time intervals')
        }

        const sprint = await models.Sprint.create(sprintInfo)

        if (!sprint){ 
            throw new AppError('Problem faced while saving sprint')
        }

        return sprint
    }

    async getSprintsTasks( projectId: number, sprintId: number): Promise<ProjectTask[]> { 

    try{
        
        const sprintsTasks = await models.Task.findAll({
            where: { 
                projectId: projectId,
                sprintId: sprintId
            },
            include: [
                {
                    model: models.ProjectMember,
                    as: 'assignedByMember',
                    include: [{ 
                        model: models.User, 
                        as: 'user',
                        attributes: ['fullName', 'avatarUrl','email'] 
                    }],
                    attributes: ['id']
                },
                {
                    model: models.ProjectMember,
                    as: 'assignedToMember',
                    include: [{ 
                        model: models.User, 
                        as: 'user',
                        attributes: ['fullName', 'avatarUrl','email'] 
                    }],
                    attributes: ['id']
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

        if(!sprintsTasks) { 
            throw new AppError('Cannot find tasks')
        }

        const tasks: ProjectTask[] = [];

        for (const task of sprintsTasks) {

            tasks.push({
                id: task.id as number,
                title: task.title,
                description: task.description as string,
                priority: task.priority,
                deadline: task.deadline,
                assignedBy: {
                    id: task.assignedByMember.id,
                    name: task.assignedByMember.user.fullName as string,
                    email: task.assignedByMember.user.email,
                    avatarUrl: task.assignedByMember.user.avatarUrl,
                },
                assignedTo: {
                    id: task.assignedToMember.id,
                    name: task.assignedToMember.user.fullName as string,
                    email: task.assignedToMember.user.email,
                    avatarUrl: task.assignedToMember.user.avatarUrl,
                },
                status: task.status,
                history : task.history,
                createdAt: task.createdAt
            });
        };
        
        return tasks

        }catch(err){
            throw err
        }

    }
}

export default new ProjectService();
