import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { FormattedProject, ProjectDetails, Invite } from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import ProjectInvitation from '@/models/projectInvitation';
import User from '@/models/user';
import Project from '@/models/project';

class ProjectService {

	async leaveProject(projectId: number, userId: number): Promise<void> {
			
		try {

			if (!projectId) { throw new Error('Project ID is required') };
			if (!userId) { throw new Error('User ID is required') };

			const leftProjectCount =  await models.ProjectMember.destroy({
				where: { projectId: projectId, userId: userId }
			});

			if (leftProjectCount === 0) {
				throw new Error("Could not leave the project"); 
			}

		} catch (error) {

			console.error('Error leaving the project:', error);
			throw new Error('Internal server error');

		}

	}

	async createProject(userId: number, title: string, position: string): Promise<object> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.create({ title }, { transaction });
		
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

			console.error('Error creating new project:', error);

			await transaction.rollback();
			throw new Error('Internal server error');

		}

	}

	async inviteToProject(
		projectId: number,
		receiverEmail: string,
		positionOffered: string,
		roleOffered: 'manager' | 'member'
	): Promise<Invite> {

		const transaction: Transaction = await sequelize.transaction();

		try {
			
			const userExists = await models.User.findOne({
				where: { email: receiverEmail },
				transaction,
			});

			if (userExists) {

				const userId = userExists.id;

				return createInvite(userId);

			} else {

				const newUser = await models.User.create({

					email: receiverEmail,
					isInvited: true,

				}, { transaction });

				if (newUser) {

					const userId = newUser.id;

					return createInvite(userId);

				}

				throw new Error('Unexpected state: no user');

			}

			async function createInvite(userId: number) {
				
				try {
					
					const notification = await models.Notification.create({ 
						message: 'You have been invited to join a project!',
						type: 'invite',
						priority: 'low',
						userId: userId,
						projectId: projectId,
					}, { transaction });

					const notificationId = notification.id;

					const projectInvitation = await models.ProjectInvitation.create({ 
						projectId: projectId,
						notificationId: notificationId,
						invitedUserId: userId,
						positionOffered: positionOffered,
						roleOffered: roleOffered,
					}, { transaction });

					const fullInvite = await models.ProjectInvitation.findOne({
						where: { projectId: projectId },

						include: [

							{
								model: models.Project,
								as: 'project'
							}

						],

						transaction

					});

					await transaction.commit();

					return { projectInvitation, fullInvite };

				} catch (error) {

					console.error(error);
					throw new Error('Error creating project invitation');
					
				}

			}

		} catch (error) {

			console.error('Error sending project invitation:', error);

			await transaction.rollback();
			throw new Error('Internal server error');

		}

	}

	async invitationStatus(inviteStatus: 'accepted' | 'rejected', inviteId: number): Promise<object> {
		
		const transaction: Transaction = await sequelize.transaction();

		try {
			const [count] = await models.ProjectInvitation.update(

				{ status: inviteStatus },

				{
					where: { id: inviteId },
					transaction,
				}
				
			);

			if (count === 0) {
				throw new Error('Project invitation not found');
			}

			const invite = await models.ProjectInvitation.findByPk(inviteId, { transaction });

			if (!invite) {

				throw new Error('Project invitation not found after update');

			}

			const { projectId, invitedUserId, positionOffered, roleOffered } = invite;

			if (!projectId || !invitedUserId) {

				throw new Error('Missing projectId or invitedUserId');

			}

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

			throw new Error('Invalid status');

		} catch (error) {

			console.error('Error updating project invitation status:', error);

			await transaction.rollback();
			throw new Error('Internal server error');

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
			throw new Error(`User with id ${userId} not found.`);
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

			if (!projectId) {
				throw new Error('Project ID is required');
			}
		
			const [count, rows] = await models.Project.update(updatedFields, {
				where: { id: projectId },
				returning: true,
			});
		
			if (count === 0 || rows.length === 0) {
				throw new Error('Project not found');
			}
		
			return rows[0].toJSON();

		} catch (error) {

			console.error('Error updating the project:', error);
			throw new Error('Internal server error');

		}

	}

	async deleteProject(projectId: number): Promise<void> {

		try {

			const deletedProjectCount = await models.Project.destroy({
				where: { id: projectId }
			});
		
			if (deletedProjectCount === 0) {
				throw new Error('Project not found');
			}

		} catch (error) {

			console.error('Error deleting the project:', error);
			throw new Error('Internal server error');

		}

	}

	async getProjectDetails(userId: number, projectId: number): Promise<ProjectDetails> { 

		try {

			const project = await models.Project.findByPk(projectId, {
				include: [{
					model: models.User,
					as: 'users',
					attributes: ['fullName', 'email'],
					through: {
						as: 'projectMember',
						attributes: ['id', 'position', 'roleId'] 
					},
				}]
			});

			if (!project) throw new Error(`Couldn't find project with id - ${projectId}`);
	
			const team = project.users.map((pm: User) => {

				const projectMember = pm.projectMember;

				return {
					id: projectMember.id as number,
					name: pm.fullName,
					email: pm.email,
					position: projectMember.position,
					role: projectMember.roleId as number
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
							attributes: ['fullName'] 
						}],
					},
					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						include: [{ 
							model: models.User, 
                            as: 'user',
							attributes: ['fullName'] 
						}],
					},
					{ 
						model: models.Subtask 
					},
				],
			});

			const allTasks = tasks.map((task: Task) => ({
				id: task.id as number,
				title: task.title,
				description: task.description as string,
				priority: task.priority,
				deadline: task.deadline,
				subtask: task.subtasks,
				assignedBy: task.assignedByMember.user.fullName as string,
				assignedTo: task.assignedToMember.user.fullName as string,
				status: task.status,
			}));
		
			const myTasks = tasks
				.filter((task: Task) => task.assignedTo === userId)
				.map((task: Task) => ({
					id: task.id as number,
					title: task.title,
					description: task.description,
					priority: task.priority,
					deadline: task.deadline,
					assignedBy: task.assignedByMember.user.fullName as string,
					status: task.status,
					subtask: task.subtasks,
					completion_note: task.completionNote as string | null,
					rejection_reason: task.rejectionReason as string | null,
					approval_note: task.approvalNote as string | null,
				}));
		
			const assignedTasks = tasks
				.filter((task: Task) => task.assignedBy === userId)
				.map((task: Task) => ({
					id: task.id as number,
					title: task.title,
					description: task.description,
					priority: task.priority,
					deadline: task.deadline,
					assignedTo: task.assignedToMember.user.fullName as string,
					subtask: task.subtasks,
					status: task.status,
					completion_note: task.completionNote as string | null,
					rejection_reason: task.rejectionReason as string | null,
					approval_note: task.approvalNote as string | null,
				}));
		
			const reviews = tasks
				.filter(
					(task: Task) =>
					task.assignedBy === userId && task.status === 'under review'
				)
				.map((task: Task) => ({
					id: task.id as number,
					title: task.title,
					description: task.description,
					priority: task.priority,
					deadline: task.deadline,
					assignedTo: task.assignedToMember.user.fullName as string,
					subtask: task.subtasks,
					status: task.status,
					completion_note: task.completionNote as string | null,
					rejection_reason: task.rejectionReason as string | null,
					approval_note: task.approvalNote as string | null,
					submitted: task.updatedAt,
			}));
		
			const invites = await models.ProjectInvitation.findAll({
				where: { projectId },
				include: [{
					model: models.User,
					as: 'user'
				}]
			});
		
			const formattedInvites = invites.map((invite: ProjectInvitation) => ({
				id: invite.id as number,
				status: invite.status,
				receiver_email: invite.user.email,
				receiver_name: invite.user.fullName,
				receiver_avatar_url: invite.user.avatarUrl,
				created_at: invite.createdAt as Date,
				position_offered: invite.positionOffered as string,
				role_offered: invite.roleOffered,
			}));
	
			return {
				team: team,
				allTasks: allTasks,
				myTasks: myTasks,
				assignedTasks: assignedTasks,
				reviews: reviews,
				invites: formattedInvites,
			} as ProjectDetails;

		} catch(err) {

			const error = err as Error;

			console.log(error.message);
			throw new Error(error.message);

		}

	}

	async createTask(task : Task): Promise<object> {

    	const transaction = await sequelize.transaction();

		try {

			const newTask = await models.Task.create(task, { transaction } );
            
			if (task.subtasks.length > 0) {

				await models.Subtask.bulkCreate(task.subtasks.map((subtask) => (
					{
						title: subtask.title,
						taskId: newTask.id,
					}
				)), { transaction });

			} 

			await transaction.commit();

			return newTask.toJSON();

		} catch (error) {

			console.error('Error creating task', error);

			await transaction.rollback();
			throw new Error('Internal server error');

		}

  	}

	async updateTeamMemberRole(projectId: number, memberId: number, newRole: string): Promise<ProjectMember> {

		try {

			if (!projectId) { throw new Error('Project ID is required') };
			if (!memberId) { throw new Error('Member ID is required') };
		
			const project = await models.Project.findByPk(projectId);
			if (!project) throw new Error('Project not found');
			const member = await models.ProjectMember.findByPk(memberId);
			if (!member) throw new Error('Team member not found');
		
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

			console.error('Error updating the team members role in the Project:', error);
			throw new Error('Internal server error');

		}

	}

	async removeTeamMember(projectId: number, memberId: number): Promise<void> {

		try {

			if (!projectId) { throw new Error('Project ID is required') };
			if (!memberId) { throw new Error('Member ID is required') };
		
			const removedTeamMemberCount = await models.ProjectMember.destroy({ where: { id: memberId, projectId: projectId } });
		
			if (removedTeamMemberCount === 0) {
				throw new Error("Team member or project not found"); 
			}

		} catch (error) {

			console.error('Error removing the team member from the project:', error);
			throw new Error('Internal server error');

		}

	}

}

export default new ProjectService();