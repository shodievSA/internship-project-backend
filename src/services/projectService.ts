import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { CreateTaskBody, PlainProject, FormattedProject, ProjectDetails } from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import ProjectInvitation from '@/models/projectInvitation';

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

	async getProjects(userId: number): Promise<FormattedProject[]> {

		const user = await models.User.findByPk(userId, {
			include: [{ model: models.Project }]
		});

		if (!user) {
			throw new Error(`User with id ${userId} not found.`);
		}

		const projects = user.get('Projects') as PlainProject[];

		if (projects.length === 0) {

			return [];

		} else {

			const projectsWithStats = await Promise.all(
				projects.map(async (project: PlainProject) => {

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
				where: {id: projectId}
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
	
			const projectMembers = await models.ProjectMember.findAll({
				where: { projectId: projectId },
				attributes: ['id', 'position', 'roleId'],
				include: [
					{ 
						model: models.User, 
						attributes: ['fullName', 'email'] 
					}
				]
			});
	
			const team = projectMembers.map((pm: ProjectMember) => {
				return {
					id: pm.id as number,
					name: pm.User.fullName,
					email: pm.User.email,
					position: pm.position,
					role: pm.roleId as number
				}
			});
		
			const tasks = await models.Task.findAll({
				where: { projectId },
				include: [
					{
						model: models.ProjectMember,
						as: 'assignedByMember',
						include: [{ model: models.User, attributes: ['fullName'] }],
					},
					{
						model: models.ProjectMember,
						as: 'assignedToMember',
						include: [{ model: models.User, attributes: ['fullName'] }],
					},
					{ model: models.Subtask },
				],
			});
		
			const allTasks = tasks.map((task: Task) => ({
				id: task.id as number,
				title: task.title,
				description: task.description as string,
				priority: task.priority,
				deadline: task.deadline,
				subtask: task.Subtasks,
				assignedBy: task.assignedByMember.User.fullName as string,
				assignedTo: task.assignedToMember.User.fullName as string,
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
					assignedBy: task.assignedByMember.User.fullName as string,
					status: task.status,
					subtask: task.Subtasks,
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
					assignedTo: task.assignedToMember.User.fullName as string,
					subtask: task.Subtasks,
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
					assignedTo: task.assignedToMember.User.fullName as string,
					subtask: task.Subtasks,
					status: task.status,
					completion_note: task.completionNote as string | null,
					rejection_reason: task.rejectionReason as string | null,
					approval_note: task.approvalNote as string | null,
					submitted: task.updatedAt,
			}));
		
			const invites = await models.ProjectInvitation.findAll({
				where: { projectId }
			});
		
			const formattedInvites = invites.map((invite: ProjectInvitation) => ({
				id: invite.id as number,
				status: invite.status,
				receiver_email: invite.receiverEmail as string,
				receiver_name: invite.receiverName as string,
				receiver_avatar_url: invite.receiverAvatarUrl as string | null,
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

	async createTask(assignerId: number, projectId: number, body: CreateTaskBody): Promise<object> {

    	const transaction = await sequelize.transaction();

		try {

			const task = await models.Task.create(
				{
					title: body.title,
					description: body.description,
					priority: body.priority,
					deadline: body.deadline,
					assignedTo: body.assignedTo,
					assignedBy: assignerId,
					projectId: projectId,
				},
				{ transaction }
			);

			if (body.subtasks.length > 0) {

				await models.Subtask.bulkCreate(body.subtasks.map((subtask) => (
					{
						title: subtask,
						taskId: task.get('id'),
					}
				)), { transaction });

			}

			await transaction.commit();

			return task.toJSON();

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