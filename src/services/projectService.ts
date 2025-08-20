import Project from '@/models/project';
import Task from '@/models/task';
import User from '@/models/user';
import { sendEmailToQueue, sendFileToQueue } from '@/queues';
import {
	AppError,
	FormattedProject,
	ProjectDetails,
	ProjectMetaData,
	ProjectTask,
	SprintMetaData,
	InviteType,
	ProjectInvite,
	TeamMember
} from '@/types';
import { Op, Sequelize, Transaction } from 'sequelize';
import sequelize from '../clients/sequelize';
import { models } from '../models';
import { GmailType } from '../services/gmaiService';

class ProjectService {

	async leaveProject(projectId: number, userId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction(); 
			
		try {

			const projectMember = await models.ProjectMember.findOne({
				where: { projectId, userId },
				attributes: ['id', 'roleId', 'position'],
				transaction,
			});

			if (!projectMember) throw new AppError(
				`Failed to find project member with project id ${projectId} and user id ${userId}`, 404, true
			);

			const [user, project] = await Promise.all([
				models.User.findOne({ where: { id: userId }, attributes: ['fullName'], transaction }),
				models.Project.findOne({ where: { id: projectId }, attributes: ['title'], transaction })
			]);

			if (!user) throw new AppError(`Failed to find user with id ${userId}`, 404, true);
			if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 404, true);

			const admin = await models.ProjectMember.findOne({
				where: {
					projectId: projectId,
					roleId: 1,
				},
				include: [{ model: models.User, as: 'user', attributes: ['email'] }],
				attributes: ['userId'],
				transaction,
			});

			if (!admin) throw new AppError("No other admin to notify", 404, true);

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

	async createProject(userId: number, title: string, userPosition: string): Promise<object> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.create({ title }, { transaction });

            if (!project) throw new AppError('Failed to create new project', 500, true);
		
			await models.ProjectMember.create(
				{
					userId: userId,
					projectId: project.id,
					position: userPosition,
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

	async getProjects(userId: number): Promise<FormattedProject[]> {

		try {

			const user = await models.User.findByPk(userId, 
				{
					include: [{ 
						model: models.Project,
						as: 'projects',
					}],
					order: [[{ model: models.Project, as: 'projects' }, 'createdAt', 'DESC']]
				}
			);
	
			if (!user) throw new AppError(`Failed to find user with id ${userId}`, 500, true);
	
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

		} catch(err) {

			throw err;

		}

	}

	async updateProject(
		projectId: number, 
		updatedFields: Partial<{
			title: string;
			status: 'active' | 'paused' | 'completed';
		}>
	): Promise<object> {

		try {
		
			const [count, affectedRows] = await models.Project.update(updatedFields, {
				where: { id: projectId },
				returning: true
			});
		
			if (count === 0 || affectedRows.length === 0) {
				throw new AppError("Failed to update the project", 500, true);
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

			if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 404, true);

			const tasks = await project.getTasks({
				attributes: ['id'],
				transaction
			});

			for (const task of tasks) {

				const files = await task.getTaskFiles({
					attributes: ['key'],
					transaction
				});

				await Promise.all(files.map(file => {
					sendFileToQueue({
						key: file.key,
						action: 'remove'
					});
				}));
				
			}

			const deletedProjectCount = await models.Project.destroy({
				where: { id: projectId },
				transaction
			});
		
			if (deletedProjectCount === 0) throw new AppError(`Failed to delete project with id ${projectId}`, 500, true);

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
            
			if (!project) throw new AppError(
				`Failed to find project with id ${projectId}`, 404, true
			);
			if (!currentMember) throw new AppError(
				`Failed to find project member with user id ${userId} and project id ${projectId}`, 404, true
			);
            
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

            const team = await this.getProjectTeam(projectId);

            if (!team) throw new AppError("Failed to fetch project team", 404, true);

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

	async sendProjectInvite(
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

        return invites;

    }

    async getProjectTeam(projectId: number): Promise<TeamMember[]> {

        const project = await models.Project.findByPk(projectId, 
			{
				include: [{
					model: models.User,
					as: 'users',
					attributes: ['fullName', 'email', 'avatarUrl'],
					through: {
						as: 'projectMember',
						attributes: ['id', 'userId', 'position', 'roleId'],
					},
				}]
        	}
		);

        if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 404, true);

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

        return team;

    }

}

export default new ProjectService();
