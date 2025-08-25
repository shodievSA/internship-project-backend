import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Sequelize, Transaction } from 'sequelize';
import { 
	AppError, 
	FrontSprintAttributes,
    SprintMetaData,
	SprintDetails,
    ProjectTask
} from '@/types';
import { sendFileToQueue } from '@/queues';

class SprintService {

    async createSprint(projectId: number, sprintInfo: FrontSprintAttributes) {
        
        const project = await models.Project.findByPk(projectId);

		try {

			if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 400, true);
	
			const sprint = await models.Sprint.create({
				...sprintInfo,
				projectId: projectId
			});
	
			if (!sprint) throw new AppError("Failed to create sprint", 400, true);
	
			const createdBy = await models.ProjectMember.findOne({
				where: { id: sprint.createdBy },
				include: [{
					model: models.User,
					as: "user",
					attributes: ["email", "fullName", "avatarUrl"]
				}]
			});
	
			if (!createdBy) throw new AppError("Failed to find sprint creator", 404, true);
	
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
			
		} catch (err) {

			throw err;

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

			if (!sprint) throw new AppError(`Failed to find sprint with id ${sprintId}`, 404, true);

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
		sprintId: number, 
		updatedFields: Partial<{ 
			title: string;
			description: string;
			status: 'planned' | 'active' | 'completed' | 'overdue';
			startDate: Date;
			endDate: Date; 
		}>
	): Promise<object> {

		try {

            if (updatedFields.status && updatedFields.status === 'active') { 

                const activeSprint = await models.Sprint.findOne({
                    where:{ 
                        projectId: projectId, 
                        status: "active",
                    },
                    attributes: ["id"]
                });

                if (activeSprint && activeSprint.id != sprintId) {

                    throw new AppError("You can't have two active sprints at the same time", 400, true);

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

			if (!sprint) throw new AppError(`Failed to find sprint with id ${sprintId}`, 404, true);

			if (
				updatedFields.startDate &&
				!updatedFields.endDate &&
				(
					updatedFields.startDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000) ||
					updatedFields.startDate.getTime() > sprint.endDate.getTime()
				)
			) {
				throw new AppError("Invalid time intervals", 400, true);
			}

			if (
				updatedFields.endDate &&
				!updatedFields.startDate &&
				(
					updatedFields.endDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000) ||
					updatedFields.endDate.getTime() < sprint.startDate.getTime()
				)
			) {
				throw new AppError("Invalid time intervals", 400, true);
			}

			if (
				updatedFields.startDate && 
				updatedFields.endDate &&
				(updatedFields.startDate.getTime() < (Date.now() - 24 * 60 * 60 * 1000)) &&
				updatedFields.endDate < updatedFields.startDate
			) { 
				throw new AppError("Invalid time intervals", 400, true);
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

		} catch (err) {

            throw err;

		}

	}

    async deleteSprint(projectId: number, sprintId: number): Promise<void> {

		const transaction: Transaction = await sequelize.transaction();

		try {

			const project = await models.Project.findByPk(projectId, { 
				attributes: ['id'], 
				transaction 
			});

			if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 404, true);

			const sprint = await models.Sprint.findOne({
				where: { id: sprintId, projectId: projectId },
				attributes: ['id'],
				transaction
			});

			if (!sprint) throw new AppError(`Failed to find sprint with id ${sprintId}`, 404, true);

			const tasks = await sprint.getTasks({ attributes: ['id'], transaction });

			for (const task of tasks) {

				const files = await task.getTaskFiles({ attributes: ['key'], transaction });

				await Promise.all(files.map(file => {
					sendFileToQueue({
						key: file.key,
						action: 'remove'
					})
				}));
				
			}

			const deletedSprint = await models.Sprint.destroy({
				where: { 
                    id: sprintId,
                    projectId: projectId
                },
				transaction
			});
		
			if (deletedSprint === 0) throw new AppError("Failed to delete sprint", 400, true);

			await transaction.commit();

		} catch (err) {

			await transaction.rollback();
			throw err;

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

        } catch (err) {

            throw err;

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
            
            const activeSprint = await models.Sprint.findOne({
                where: { 
                    projectId: projectId,
                    status: 'active'
                },
                attributes: ['id', 'title', 'description', 'status', 'startDate', 'endDate'],
                order: [['created_at', 'DESC']] 
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

            return null;

        } catch (err) {

            throw err;

        }

    }

}

export default new SprintService();
