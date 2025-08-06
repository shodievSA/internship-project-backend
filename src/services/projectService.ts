import sequelize from '../clients/sequelize';
import { models } from '../models';
import {Op, Sequelize, Transaction, UpdateOptions} from 'sequelize';
import { 
	FormattedProject, 
	ProjectDetails, 
	InviteType, 
	ProjectTask, 
	ProjectInvite, 
	AppError, 
	TeamMember,
    FrontSprintAttributes,
    SprintMetaData,
	ProjectMetaData,
	SprintDetails
} from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import User from '@/models/user';
import TaskHistory from '@/models/taskHistory';
import { MemberProductivity } from '@/types'; 
import Project from '@/models/project';
import { GmailType } from '../services/gmaiService';
import { sendEmailToQueue, sendFileToQueue } from '@/queues';
import { randomUUID } from 'crypto';
import fileHandler from './fileService';
import { TaskUpdatePayload } from '@/types';
import { FilesMetaData } from '@/types';



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

			await sendEmailToQueue({
				type: GmailType.LEAVE_PROJECT,
				receiverEmail: admin.user.email,
				params: [project.title, userRole, position],
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

			return {
				id: project.id,
				title: project.title,
				status: project.status,
				createdAt: project.createdAt,
				members: 1,
				totalSprints: 0,
				totalSprintsCompleted: 0,
				isAdmin: true
			};

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

					await sendEmailToQueue({
						type: GmailType.PROJECT_INVITE,
						receiverEmail: receiverEmail,
						params: [fullProdInvite!.project.title, roleOffered, positionOffered]
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

	async updateInviteStatus(
		inviteStatus: 'accepted' | 'rejected', 
		inviteId: number
	): Promise<object> {
		
		const transaction: Transaction = await sequelize.transaction();

		try {

			const [count] = await models.Invite.update({ status: inviteStatus }, {
				where: { id: inviteId },
				transaction
			});

			if (count === 0) throw new AppError('Project invitation not found');

			const invite = await models.Invite.findByPk(inviteId, { 
				include: { 
					model: models.User, 
					as: 'inviter', 
					attributes: ['email']
				}, 
				transaction 
			});

			if (!invite) throw new AppError('Project invitation not found after update');			

			const { 
				projectId, 
				invitedUserId, 
				positionOffered, 
				roleOffered 
			} = invite;

			const [user, project] = await Promise.all([
				models.User.findByPk(invitedUserId, { transaction }),
				models.Project.findByPk(projectId, { transaction })
			]);

			if (!user) throw new AppError(`Couldn't find user with id ${invitedUserId}`);
			if (!project) throw new AppError(`Couldn't find project with id ${projectId}`);

			const roleId = (roleOffered === 'manager') ? 2 : 3;

			if (inviteStatus === 'accepted') {

				const newMember = await models.ProjectMember.create(
					{
						userId: invitedUserId,
						projectId: projectId,
						roleId: roleId,
						position: positionOffered,
					},
					{ transaction }
				);

				const [members, sprints, completedSprints, isAdmin] = await Promise.all([
					models.ProjectMember.count({ where: { projectId } }),
					models.Sprint.count({ where: { projectId } }),
					models.Sprint.count({ where: { projectId, status: 'completed' } }),
					models.ProjectMember.findOne({
						where: {
							projectId: projectId,
							userId: user.id,
							roleId: await models.Role.findOne({
								where: { name: 'admin' },
								attributes: ['id'],
							}).then((role) => role?.id),
						},
						raw: true,
					}).then((member) => !!member)
				]);

				const projectMetaData = {
					id: project.id,
					title: project.title,
					status: project.status,
					createdAt: project.createdAt,
					members: members,
					totalSprints: sprints,
					totalSprintsCompleted: completedSprints,
					isAdmin: isAdmin
				} as FormattedProject;

				await models.Notification.create({
					title: 'Project invitation accepted',
					message: `${user!.fullName} has joined the project!`,
					userId: invite.invitedBy
				}, { transaction });

				await transaction.commit();

				await sendEmailToQueue({
					type: GmailType.PROJECT_INVITE_ACCEPT,
					receiverEmail: invite.inviter.email,
					params: [project!.title, roleOffered, positionOffered, projectId]
				});

				return {
					invitation: invite.toJSON(),
					newMember: newMember,
					projectMetaData: projectMetaData
				};

			}

			if (inviteStatus === 'rejected') {

				await models.Notification.create({
					title: 'Project invitation rejected',
					message: `${user!.fullName} has rejected the project invitation!`,
					userId: invite.invitedBy
				}, { transaction });

				await transaction.commit();

				await sendEmailToQueue({
					type: GmailType.PROJECT_INVITE_REJECT,
					receiverEmail: invite.inviter.email,
					params: [project!.title, roleOffered, positionOffered, projectId]
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
                    individualHooks: true, 
                    context: { comment },  
					transaction,

				} as UpdateOptions 

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
						attributes: ['roleId', 'position', 'id'],
						include: [{ model: models.User, as: 'user', attributes: ['id', 'fullName', 'avatarUrl', 'email'] }]
					},

					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						attributes: ['roleId', 'position', 'id'],
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
					name: task.assignedByMember.user.fullName,
					avatarUrl: task.assignedByMember.user.avatarUrl,
					id: task.assignedByMember.id,
					position: task.assignedByMember.position,
					email: task.assignedByMember.user.email
				},
				assignedTo: {
					name: task.assignedToMember.user.fullName,
					avatarUrl: task.assignedToMember.user.avatarUrl,
					id: task.assignedToMember.id,
					position: task.assignedToMember.position,
					email: task.assignedToMember.user.email
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

			await transaction.commit();	

			await sendEmailToQueue({
				type: GmailType.CHANGE_TASK_STATUS,
				receiverEmail: email,
				params: [task.project.title, emailTitle, updatedTask.title, role, position, projectId, tasksType]
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
				as: 'projects',
			}],
			order: [[{ model: models.Project, as: 'projects' }, 'createdAt', 'DESC']]
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
		
					const [members, sprints, completedSprints, isAdmin] = await Promise.all([
						models.ProjectMember.count({ where: { projectId } }),
						models.Sprint.count({ where: { projectId } }),
						models.Sprint.count({ where: { projectId, status: 'completed' } }),
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
						totalSprints: sprints,
						totalSprintsCompleted: completedSprints,
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

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.findByPk(projectId, { attributes: ['id'], transaction });

			if (!project) throw new AppError('Project not found');

			const tasks = await project.getTasks({
				attributes: ['id'],
				transaction
			});

			for (const task of tasks) {

				const files = await task.getTaskFiles({
					attributes: ['key'],
					transaction
				});

				await Promise.all(
					files.map(file => {
						sendFileToQueue({
							key: file.key,
							action: 'remove'
						});
					})
				)
				
			}

			const deletedProjectCount = await models.Project.destroy({
				where: { id: projectId },
				transaction
			});
		
			if (deletedProjectCount === 0) {
				throw new AppError('Project not found');
			}

			await transaction.commit();

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

	}

	async getProjectDetails(userId: number, projectId: number): Promise<ProjectDetails> { 

		try {

			const project = await models.Project.findByPk(projectId, {
				attributes: ['id', 'title', 'status', 'createdAt'],
                include: [
					{
						model: models.Sprint,
						as: 'sprints',
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

			const currentMember = await models.ProjectMember.findOne({
				where: {
					userId: userId,
					projectId: projectId
				}
			});
            
			if (!project) throw new AppError(`Couldn't find project with id - ${projectId}`);
			if (!currentMember) throw new AppError("Couldn't find current project member");
            
            const projectMetaData: ProjectMetaData = {
				id: project.id,
				title: project.title,
				status: project.status,
				createdAt: project.createdAt,
				activeSprintId: null
			};
			
            const sprints: SprintMetaData[] = [];

            for (const sprint of project.sprints) { 

                if (sprint.status === "active") { 
                    projectMetaData.activeSprintId = sprint.id;
                }

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
                    totalTasksCompleted: Number(sprint.get('closedTaskCount')),
                    totalTasks: Number(sprint.get('taskCount')),
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                });

            }

            let rawProjectTasks: Task[] = [];

            if (projectMetaData.activeSprintId) { 

                rawProjectTasks = await models.Task.findAll({
                    where: { 
                        projectId: projectId,
                        sprintId: projectMetaData.activeSprintId,

                        [Op.or]: [
                            { assignedBy: currentMember.id },
                            { assignedTo: currentMember.id }
                        ]
                    },
                    include: [
                        {
                            model: models.ProjectMember,
                            as: 'assignedByMember',
                            attributes: ['id', 'position'],
                            include: [{ 
                                model: models.User, 
                                as: 'user',
                                attributes: ['fullName', 'avatarUrl', 'email'] 
                            }],
                        },
                        {
                            model: models.ProjectMember,
                            as: 'assignedToMember',
                            attributes: ['id', 'position'],
                            include: [{ 
                                model: models.User, 
                                as: 'user',
                                attributes: ['fullName', 'avatarUrl', 'email'] 
                            }],
                        },
                        {
                            model: models.TaskHistory,
                            as: 'history',
                            separate: true,
                            order: [['created_at', 'DESC']]
                        },
                        {
                            model: models.TaskFiles,
                            as: 'taskFiles'
                        }
                    ],
                    order: [['created_at', 'DESC']]
			    });

            } 

			const tasks: ProjectTask[] = [];

			for (const task of rawProjectTasks) {

                tasks.push({
                    id: task.id as number,
                    title: task.title,
                    description: task.description as string,
                    priority: task.priority,
                    deadline: task.deadline,
                    sprintId: task.sprintId,
                    assignedBy: {
                        name: task.assignedByMember.user.fullName as string,
                        avatarUrl: task.assignedByMember.user.avatarUrl,
						id: task.assignedByMember.id,
						position: task.assignedByMember.position,
						email: task.assignedByMember.user.email
                    },
                    assignedTo: {
                        name: task.assignedToMember.user.fullName as string,
                        avatarUrl: task.assignedToMember.user.avatarUrl,
						id: task.assignedToMember.id,
						position: task.assignedToMember.position,
						email: task.assignedToMember.user.email
                    },
                    status: task.status,
                    history : task.history,
					filesMetaData: task.taskFiles,
                    createdAt: task.createdAt,
					updatedAt: task.updatedAt
                });

			};

            const team = await this.getTeamOfProject(projectId);

            if (!team) throw new AppError("Faced error while getting team");

			return {
				metaData: projectMetaData,
				tasks: tasks,
                sprints: sprints,
                team: team,
				currentMemberId: currentMember.id,
				currentMemberRole: currentMember.role as "admin" | "manager" | "member",
			};

		} catch(err) {  

            throw err;

		}

	}

	async createTask(
		task: any, 
		userId: number, 
		projectId: number, 
		fileNames: string[], 
		sizes: number[], 
		files?: Express.Multer.File[]
	): Promise<object> {

		const deadline: Date = new Date(task.deadline);
		const uploadedFiles: string[] = [];

		const sprint = await models.Sprint.findOne({ where: { id: task.sprintId }});

		if (deadline > sprint!.endDate) throw new AppError('Task deadline cannot exceed the sprint end date');
		if (deadline < sprint!.startDate) throw new AppError('Task deadline cannot precede the sprint start date');

		if (Number.isNaN(deadline.getTime())) {
			throw new AppError('Invalid deadline format', 400);
		}

		if (deadline.getTime() < Date.now()) {
			throw new AppError('Deadline cannot be in the past', 400);
		}

		let newTask: any;
		let assignedBy: any;
		let assignedTo: any;
		let project: any;
		let newTaskHistory: any;
		let filesMetaData: any = [];

		const transaction = await sequelize.transaction();

		try {

			assignedBy = await models.ProjectMember.findOne({
				where: { userId: userId, projectId: projectId },
				attributes: ['id', 'position'],
				include: [{ model: models.User, as: 'user' }],
				transaction
			});

			assignedTo = await models.ProjectMember.findOne({
				where: { id: task.assignedTo },
				include: [{ model: models.User, as: 'user' }],
				transaction
			});

			if (!assignedBy || !assignedTo) {
				throw new AppError('No such users in project');
			}

			newTask = await models.Task.create(task,
				{ transaction }
			);

			project = await models.Project.findByPk(projectId, {
				attributes: ['title']
			});

			const history = await models.TaskHistory.create(
				{
					taskId: newTask.id,
					status: newTask.status,
				},
				{ transaction }
			);

			newTaskHistory = [history];

			if (files && files.length > 0) {

				if (files.length > 5) throw new AppError("Maximum 5 files are allowed per task", 400);

				const upload = files.map(file => {

					const key = `tasks/${newTask.id}/${randomUUID()}-${file.filename}`;
					uploadedFiles.push(key);

					return sendFileToQueue({
						key: key,
						contentType: file.mimetype,
						action: 'upload',
						filePath: file.path
					});

				});

				await Promise.all(upload);

				filesMetaData = await Promise.all(
					uploadedFiles.map((key, i) =>
						models.TaskFiles.create({ 
							taskId: newTask.id, 
							key: key, 
							fileName: fileNames[i], 
							size: sizes[i] 
						}, 
						{ transaction } 
					))
				);
				
			}

			await models.Notification.create(
				{
					userId: assignedTo.user.id,
					title: "New Task",
					message: "You've been assigned new task"
				},
				{ transaction }
			);

			await transaction.commit();

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

		if (assignedTo.user.email !== assignedBy.user.email) {

			await sendEmailToQueue({
				type: GmailType.NEW_TASK,
				receiverEmail: assignedTo.user.email,
				params: [project!.title, newTask.title, projectId]
			});
			
		}

		return {
			deadline: newTask.deadline,
			createdAt: newTask.createdAt,
			updatedAt: newTask.updatedAt,
			description: newTask.description,
			id: newTask.id,
			priority: newTask.priority,
			status: newTask.status,
			title: newTask.title,
			assignedBy: {
				id: assignedBy.id,
				name: assignedBy.user.fullName,
				avatarUrl: assignedBy.user.avatarUrl,
				position: assignedBy.position,
				email: assignedBy.user.email
			},
			assignedTo: {
				id: assignedTo.id,
				name: assignedTo.user.fullName,
				avatarUrl: assignedTo.user.avatarUrl,
				position: assignedTo.position,
				email: assignedTo.user.email
			},
			history: newTaskHistory,
			filesMetaData: filesMetaData
		} as ProjectTask;

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

				await sendEmailToQueue({
					type: GmailType.PROMOTE_DEMOTE_MEMBER,
					receiverEmail: member!.user.email,
					params: [project!.title as string, newRole, projectId]
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

			await sendEmailToQueue({
				type: GmailType.REMOVE_TEAM_MEMBER,
				receiverEmail: userToRemove.user.email,
				params: [projectTitle]
			});

		} catch (error) {

			await transaction.rollback();
			throw error;
			
		}

	}

    async deleteTask(userId: number, projectId: number, taskId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction();

        try {

			const assignedBy = await models.ProjectMember.findOne({
				where: { userId: userId },
				attributes: ['id'],
				transaction
			});

			if (!assignedBy) throw new Error("");

			const files = await models.TaskFiles.findAll({
				where: { taskId: taskId },
				attributes: ['key'],
				transaction
			});

			if (files.length > 0) {

				for (const file of files) {

					await sendFileToQueue({
						key: file.key,
						action: 'remove'
					});
					
				}

			}

            const isDeleted = await models.Task.destroy({
                where : { 
                    id: taskId,
                    projectId: projectId,
                    assignedBy: assignedBy.id
                },
                force: true,
				transaction
            });
    
            if (!isDeleted) { 
                throw new AppError('Failed to delete or no such task');
            }

			await transaction.commit();

        } catch(error) {
			
			await transaction.rollback();
            throw error;

        }

    }

    async updateTask(taskUpdatePayload: TaskUpdatePayload): Promise<ProjectTask> {

        const transaction: Transaction = await sequelize.transaction();
        
         try {

			const { projectId, taskId, filesToAdd, filesToDelete, sizes, fileNames, updatedTaskProps } = taskUpdatePayload;

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

			if (filesToDelete && filesToDelete.length > 0) {

				const taskFiles =  await models.TaskFiles.findAll(
					{ where: { id: filesToDelete }, attributes: ['key'], transaction }
				);

				await Promise.all(
					taskFiles.map(taskFile =>
						sendFileToQueue({
							key: taskFile.key,
							action: 'remove',
						})
					)
				);

				await models.TaskFiles.destroy({
					where: { id: filesToDelete },
					transaction,
				});

			}

			const editedFiles: string[] = [];

			if (filesToAdd && filesToAdd.length > 0) {

				const existingFileCount = await models.TaskFiles.count({
					where: { taskId: task.id },
					transaction,
				});

				if ((existingFileCount + filesToAdd.length) > 5) {
					throw new AppError("Maximum 5 files allowed per task", 400);
				}

				const edit = filesToAdd.map(file => {
					const key = `tasks/${task.id}/${randomUUID()}-${file.filename}`;
					editedFiles.push(key);

					return sendFileToQueue({
						key: key,
						contentType: file.mimetype,
						action: 'edit',
						filePath: file.path
					});
				});

				const taskFiles = editedFiles.map((key, i) =>
					models.TaskFiles.create(
						{
							taskId: task.id,
							key: key,
							fileName: fileNames[i],
							size: sizes[i]
						},
						{ transaction }
					)
				);

				await Promise.all([...edit, ...taskFiles]);
				
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

				await sendEmailToQueue({
					type: GmailType.REASSIGN_TASK,
					receiverEmail: task.assignedToMember.user.email,
					params: [task.project.title, task.title, projectId]
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

				await sendEmailToQueue({
					type: GmailType.NEW_TASK,
					receiverEmail: task.assignedToMember.user.email,
					params: [task.project.title, task.title, projectId]
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

				await sendEmailToQueue({
					type: GmailType.UPDATED_TASK,
					receiverEmail: task.assignedToMember.user.email,
					params: [task.project.title, task.title, projectId]
				});

            }

            await task.update(updatedTaskProps as TaskUpdatePayload, { transaction });

			const filesMetaData: FilesMetaData[] = await models.TaskFiles.findAll({
				where: { taskId: task.id },
				attributes: { exclude: ['key'] },
				transaction
			});

            await transaction.commit();

            return { 
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                deadline: task.deadline,
                assignedBy: {
                    id: task.assignedByMember.id,
                    name: task.assignedByMember.user.fullName,
                    avatarUrl: task.assignedByMember.user.avatarUrl,
					position: task.assignedByMember.position,
					email: task.assignedByMember.user.email
                },
                assignedTo: { 
                    id: task.assignedToMember.id,
                    name: task.assignedToMember.user.fullName,
                    avatarUrl: task.assignedToMember.user.avatarUrl,
					position: task.assignedToMember.position,
					email: task.assignedToMember.user.email
                },
				filesMetaData: filesMetaData,
                status: task.status,
                history: task.history,
                createdAt: task.createdAt,
				updatedAt: task.updatedAt
            } as ProjectTask;

        } catch(error) {

            await transaction.rollback();
            throw error;

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
            } else { return null }

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

    async getTeamOfProject(projectId: number): Promise<TeamMember[]> {

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

	async getTaskFiles(taskId: number): Promise<Array<object>> {

		try {

			const taskFiles = await models.TaskFiles.findAll({
				where: { taskId: taskId },
				attributes: ['id', 'key', 'fileName', 'size']
			});

			const urls = await Promise.all(
				taskFiles.map(file => fileHandler.retrieveFile(file.key))
			);

			const fileAttachments: object[] = [];

			for (let i = 0; i < taskFiles.length; i++) {
				const taskFile: object = {
					fileName: taskFiles[i].fileName,
					id: taskFiles[i].id,
					url: urls[i],
					size: Math.round((taskFiles[i].size / (1024 * 1024)) * 100) / 100,
				};

				fileAttachments.push(taskFile);
			}

			return fileAttachments;
			
		} catch (error) {
			throw error
		}
		
	}

    async createSprint(projectId: number, sprintInfo: FrontSprintAttributes ) {
        
        const project = await models.Project.findByPk(projectId);
        const startDate = new Date(sprintInfo.startDate);
        const endDate = new Date(sprintInfo.endDate);

        if (!project) throw new AppError('No such project');

        if (
			startDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000) 
			|| 
			endDate.getTime() < startDate.getTime()
		) {
            throw new AppError('Incorrect time intervals');
        }

        const sprint = await models.Sprint.create({
			...sprintInfo,
			projectId: projectId
		});

        if (!sprint) throw new AppError('Problem faced while saving sprint');

		const createdBy = await models.ProjectMember.findOne({
			where: { id: sprint.createdBy },
			include: [{
				model: models.User,
				as: "user",
				attributes: ["email", "fullName", "avatarUrl"]
			}]
		});

		if (!createdBy) throw new AppError('Problem faced while finding sprint creator');

        return {
			id: sprint.id,
			title: sprint.title,
			description: sprint.description,
			status: sprint.status,
			projectId: sprint.projectId,
			createdBy: {
				fullName: createdBy.user.fullName,
				avatarUrl: createdBy.user.avatarUrl,
				email: createdBy.user.email
			},
			totalTasksCompleted: 0,
			totalTasks: 0,
			startDate: sprint.startDate,
			endDate: sprint.endDate,
		}

    }

    async getSprintDetails(projectId: number, sprintId: number): Promise<SprintDetails> { 

		try {

			const sprint = await models.Sprint.findByPk(sprintId, {				
				attributes: {
					include: [ 
						[
							Sequelize.literal(`(
								SELECT COUNT (*)
								FROM tasks AS t 
								WHERE t.sprint_id = ${sprintId}
							)`),
							'taskCount'
						],
						[
							Sequelize.literal(`(
								SELECT COUNT (*)
								FROM tasks AS t 
								WHERE t.sprint_id = ${sprintId} AND t.status = 'closed'
							)`),
							'closedTaskCount'
						],
					]
				},
				include: [
					{
						model: models.ProjectMember,
						as: 'createdByMember',
						include: [{ 
							model: models.User, 
							as: 'user',
							attributes: ['fullName', 'avatarUrl', 'email'] 
						}],
					}
				]
			});

			if (!sprint) throw new AppError(`Can't find sprint with id - ${sprintId}`);

			const sprintMetaData: SprintMetaData = {
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
				totalTasksCompleted: Number(sprint.get('closedTaskCount')),
				totalTasks: Number(sprint.get('taskCount')),
				startDate: sprint.startDate,
				endDate: sprint.endDate,
			};
			
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
					},
					{
						model: models.TaskFiles,
						as: "taskFiles"
					}
				],
				order: [['created_at', 'DESC']]
			});

			if (!sprintsTasks) throw new AppError('Cannot find tasks');

			const tasks: ProjectTask[] = [];

			for (const task of sprintsTasks) {

				tasks.push({
					id: task.id as number,
					title: task.title,
					description: task.description as string,
					priority: task.priority,
					deadline: task.deadline,
                    sprintId: task.sprintId,
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
					filesMetaData: task.taskFiles,
					createdAt: task.createdAt,
					updatedAt: task.updatedAt
				});

			};
			
			return {
				metaData: sprintMetaData,
				tasks: tasks
			};

		} catch(err) {

			throw err;

		}

    }

    async updateSprint(
		projectId: number, 
		sprintId:number, 
		updatedFields: Partial<{ 
			title: string;
			description:string;
			status: 'planned' | 'active' | 'completed' | 'overdue';
			startDate: Date;
			endDate: Date; 
		}>
	): Promise<object> {

		try {
            if (
                updatedFields.status &&
                updatedFields.status === 'active' 
            ) { 
                const activeSprint = await models.Sprint.findOne({
                    where:{ 
                        projectId: projectId, 
                        status: "active",
                    },
                    attributes: ["id"]
                });

                if ( activeSprint && activeSprint.id != sprintId) { 
                    throw new AppError("Looks like you have another active sprint")
                }
            }
			const sprint = await models.Sprint.findOne({
				where: { 
					id: sprintId,
					projectId: projectId
				},
				attributes: {
					include: [
						[
							Sequelize.literal(`(
								SELECT COUNT (*)
								FROM tasks AS t 
								WHERE t.sprint_id = ${sprintId}
							)`),
							'taskCount'
						],
						[
							Sequelize.literal(`(
								SELECT COUNT (*)
								FROM tasks AS t 
								WHERE t.sprint_id = ${sprintId} AND t.status = 'closed'
							)`),
							'closedTaskCount'
						],
					]
				},
				include: [
					{
						model: models.ProjectMember,
						as: 'createdByMember',
						include: [{ 
							model: models.User, 
							as: 'user',
							attributes: ['fullName', 'avatarUrl', 'email'] 
						}],
					}
				]
			});

			if (!sprint) throw new AppError("Sprint not found");

			if (
				updatedFields.startDate &&
				!updatedFields.endDate &&
				(
					updatedFields.startDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000) ||
					updatedFields.startDate.getTime() > sprint.endDate.getTime()
				)
			) {
				throw new AppError('Incorrect time intervals');
			}

			if (
				updatedFields.endDate &&
				!updatedFields.startDate &&
				(
					updatedFields.endDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000) ||
					updatedFields.endDate.getTime() < sprint.startDate.getTime()
				)
			) {
				throw new AppError('Incorrect time intervals');
			}

			if (
				updatedFields.startDate && 
				updatedFields.endDate &&
				(updatedFields.startDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000)) &&
				updatedFields.endDate < updatedFields.startDate
			) { 
				throw new AppError("Incorrect time intervals");
			}

			const updatedSprint = await sprint.update(updatedFields);

			return {
				id: updatedSprint.id,
				title: updatedSprint.title,
				description: updatedSprint.description,
				status: updatedSprint.status,
				projectId: updatedSprint.projectId,
				createdBy: {
					fullName: updatedSprint.createdByMember.user.fullName,
					avatarUrl: updatedSprint.createdByMember.user.avatarUrl,
					email: updatedSprint.createdByMember.user.email
				},
				totalTasksCompleted: Number(updatedSprint.get('closedTaskCount')),
				totalTasks: Number(updatedSprint.get('taskCount')),
				startDate: updatedSprint.startDate,
				endDate: updatedSprint.endDate,
			};

		} catch (error) {

            throw error;

		}

	}

    async deleteSprint(projectId: number, sprintId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.findByPk(projectId, { attributes: ['id'], transaction });
			if (!project) throw new AppError('Project not found');

			const sprint = await models.Sprint.findOne({
				where: { id: sprintId, projectId: projectId },
				attributes: ['id'],
				transaction
			});
			if (!sprint) throw new AppError('Sprint not found');

			const tasks = await sprint.getTasks({ attributes: ['id'], transaction });

			for (const task of tasks) {

				const files = await task.getTaskFiles({ attributes: ['key'], transaction });

				await Promise.all(
					files.map(file => {
						sendFileToQueue({
							key: file.key,
							action: 'remove'
						})
					})
				);
				
			}

			const deletedSprint = await models.Sprint.destroy({
				where: { 
                    id: sprintId,
                    projectId: projectId
                },
				transaction
			});
		
			if (deletedSprint === 0) {
				throw new AppError('Project not found');
			}

			await transaction.commit();

		} catch (error) {

			await transaction.rollback();
			throw error;

		}

	}

    async getAllSprints(projectId: number): Promise<Array<{
        id: number;
        title: string;
        description: string | null;
        status: 'planned' | 'active' | 'completed' | 'overdue';
        startDate: Date;
        endDate: Date;
    }>> {
        try {
            const sprints = await models.Sprint.findAll({
                where: { 
                    projectId: projectId
                },
                attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
                order: [['created_at', 'ASC']]
            });

            return sprints.map(sprint => ({
                id: sprint.id,
                title: sprint.title,
                description: sprint.description,
                status: sprint.status,
                startDate: sprint.startDate,
                endDate: sprint.endDate
            }));

        } catch (error) {
            throw error;
        }
    }

    async getDefaultSprint(projectId: number): Promise<{
        id: number;
        title: string;
        description: string | null;
        status: 'planned' | 'active' | 'completed' | 'overdue';
        startDate: Date;
        endDate: Date;
    } | null> {
        try {
            // First, try to find an active sprint
            const activeSprint = await models.Sprint.findOne({
                where: { 
                    projectId: projectId,
                    status: 'active'
                },
                attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
                order: [['created_at', 'DESC']] // If multiple active sprints, get the most recently created one
            });

            if (activeSprint) {
                return {
                    id: activeSprint.id,
                    title: activeSprint.title,
                    description: activeSprint.description,
                    status: activeSprint.status,
                    startDate: activeSprint.startDate,
                    endDate: activeSprint.endDate
                };
            }

            // If no active sprint, get the sprint with the latest end date
            const latestSprint = await models.Sprint.findOne({
                where: { 
                    projectId: projectId
                },
                attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
                order: [['endDate', 'DESC']]
            });

            if (latestSprint) {
                return {
                    id: latestSprint.id,
                    title: latestSprint.title,
                    description: latestSprint.description,
                    status: latestSprint.status,
                    startDate: latestSprint.startDate,
                    endDate: latestSprint.endDate
                };
            }

            return null; // No sprints found
        } catch (error) {
            throw error;
        }
    }

}

export default new ProjectService();
