import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { FormattedProject, ProjectDetails, InviteType, AssignedTaskType, ReviewType, ProjectTaskDetails, formattedInvites, AppError } from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import User from '@/models/user';
import Project from '@/models/project';

class ProjectService {

	async leaveProject(projectId: number, userId: number): Promise<void> {
			
		try {

			if (!projectId) { throw new AppError('Project ID is required') };
			if (!userId) { throw new AppError('User ID is required') };

			const leftProjectCount =  await models.ProjectMember.destroy({
				where: { projectId: projectId, userId: userId }
			});

			if (leftProjectCount === 0) {
				throw new AppError("Could not leave the project"); 
			}

		} catch (error) {

            throw error

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
            transaction.rollback()
            throw error
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

					const [_ , isCreated] = await models.Invite.findOrCreate({ 
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
                    transaction.rollback()
                    throw error
					
				}

			}

		} catch (error) {
            transaction.rollback()
            throw error

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
			throw error

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
		
			const [count, rows] = await models.Project.update(updatedFields, {

				where: { id: projectId },
				returning: true,

			});
		
			if (count === 0 || rows.length === 0) {

				throw new AppError('Project not found');
				
			}
		
			return rows[0].toJSON();

		} catch (error) {

            throw error

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

			throw error

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
						attributes: ['id', 'position', 'roleId'],
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
		
			const tasks = await models.Task.findAll({
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
            
            const userProjectMember = await models.ProjectMember.findOne({
                where: { userId: userId },
                attributes: ['id']
            });

            if (!userProjectMember) throw new AppError(`Project member doesn't exist`);
            
            let allTasks: ProjectTaskDetails[] = [];
            let myTasks: ProjectTaskDetails[] = [];
            let assignedTasks: AssignedTaskType[] = [];
            let reviews: ReviewType[] = [];

			for (const task of tasks) {

                allTasks.push({
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

                if (task.assignedBy === userProjectMember.id) {

                    assignedTasks.push({ 
                        id: task.id as number,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        deadline: task.deadline,
                        assignedTo: {
                            name: task.assignedToMember.user.fullName as string,
                            avatarUrl: task.assignedToMember.user.avatarUrl,
							id: task.assignedToMember.id
                        },
						assignedBy: {
							name: task.assignedByMember.user.fullName as string,
							avatarUrl: task.assignedByMember.user.avatarUrl,
							id: task.assignedByMember.id
                    	},
                        subtasks: task.subtasks,
                        status: task.status,
                        history : task.history,
                        createdAt: task.createdAt
                    });

                }

                if (task.assignedBy === userProjectMember.id && task.status === 'under review') { 

                    reviews.push({
                        id: task.id as number,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        deadline: task.deadline,
                        assignedTo: {
                            name: task.assignedToMember.user.fullName as string,
                            avatarUrl: task.assignedToMember.user.avatarUrl,
							id: task.assignedToMember.id 
                        },
                        subtasks: task.subtasks,
                        status: task.status,
                        history : task.history,
                        submitted: task.updatedAt,
                        createdAt: task.createdAt,
                    })

                } 
                
                if (task.assignedTo === userProjectMember.id ) {  

                    myTasks.push({
                        id: task.id as number,
                        title: task.title,
                        description: task.description,
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
                        subtasks: task.subtasks,
                        history : task.history,
                        createdAt: task.createdAt,
                    })

                } 

			};
		
			const invites = await models.Invite.findAll({
				where: { projectId },
				include: [{
					model: models.User,
					as: 'user'
				}],
                order: [['created_at', 'DESC']]
			});

			const formattedInvites: formattedInvites[] = [];

			for (const invite of invites) {

				formattedInvites.push({
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
	
			return {
				team: team,
				allTasks: allTasks,
				myTasks: myTasks,
				assignedTasks: assignedTasks,
				reviews: reviews,
				invites: formattedInvites,
			} as ProjectDetails;

		} catch(error) {  
            throw error

		}

	}

	async createTask(task: Task, userId: number): Promise<object> {

    	const transaction = await sequelize.transaction()

		try {

            const project = await models.Project.findOne({
				where: { id: task.projectId },
				attributes: ['title']
            });

			const assignedBy = await models.ProjectMember.findOne({
				where: { userId: userId },
				attributes: ['id']
			});

			task.assignedBy = assignedBy?.id as number;

			const newTask = await models.Task.create(task, { transaction });
            
			if (task.subtasks.length > 0) {

				await models.Subtask.bulkCreate(task.subtasks.map((subtask) => (
					{
						title: subtask.title,
						taskId: newTask.id,
					}
				)), { transaction });

			} 
            
            await models.Notification.create({
				title: "New Task",
                message: `Project: ${project?.title}\nAssigned new task!`,
                userId: userId
            },{transaction})
            

            await models.TaskHistory.create ({
                taskId: newTask.id,
                status: newTask.status,

            }, {transaction})

			await transaction.commit();

			return newTask.toJSON();

		} catch (error) {

			await transaction.rollback();
			throw error

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
				throw new AppError('Failed to update team member role');
			}
			
			return rows[0].toJSON() as ProjectMember;

		} catch (error) {

            throw error

		}

	}

	async removeTeamMember(projectId: number, memberId: number): Promise<void> {

		try {

			if (!projectId) { throw new AppError('Project ID is required') };
			if (!memberId) { throw new AppError('Member ID is required') };
		
			const removedTeamMemberCount = await models.ProjectMember.destroy({ where: { id: memberId, projectId: projectId } });
		
			if (removedTeamMemberCount === 0) {
				throw new AppError("Team member or project not found"); 
			}

		} catch (error) {

            throw error

		}

	}

    async deleteTask(userId: number, projectId: number, taskId: number): Promise<void> {
        try{

            const isDeleted = await models.Task.destroy({
                where : { 
                    id: taskId,
                    projectId: projectId,
                    assignedBy: userId,
    
                }
            })
    
            if (!isDeleted) { 
                throw new AppError('Failed to delete or no such task')
            }

        }
        catch(error) {
            throw error
        }

    }
}

export default new ProjectService();