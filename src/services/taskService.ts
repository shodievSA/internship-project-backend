import sequelize from '../clients/sequelize';
import { models } from '../models';
import { Transaction, UpdateOptions } from 'sequelize';
import { 
	ProjectTask, 
	AppError, 
	TaskUpdatePayload,
	FilesMetaData,
    TaskInfoFromUser,
} from '@/types';
import ProjectMember from '@/models/projectMember';
import Task from '@/models/task';
import User from '@/models/user';
import TaskHistory from '@/models/taskHistory';
import Project from '@/models/project';
import { GmailType } from '../services/gmaiService';
import { sendEmailToQueue, sendFileToQueue } from '@/queues';
import { randomUUID } from 'crypto';
import fileHandler from './fileService';
import TaskFiles from '@/models/taskFiles';

class TaskService {

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
				updatedAt: task.updatedAt,
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

	async createTask(
		task: TaskInfoFromUser, 
		userId: number, 
		projectId: number, 
		fileNames: string[], 
		sizes: number[], 
		files?: Express.Multer.File[]
	): Promise<ProjectTask> {

		const uploadedFiles: string[] = [];

		const sprint = await models.Sprint.findOne({ where: { id: task.sprintId }});
        if (!sprint) throw new AppError("Sprint not found", 404);

		if (task.deadline > sprint.endDate) throw new AppError('Task deadline cannot exceed the sprint end date');
		if (task.deadline < sprint.startDate) throw new AppError('Task deadline cannot precede the sprint start date');

        let newTask: Task | null = null;
        let assignedBy: ProjectMember | null = null;
        let assignedTo: ProjectMember | null = null;
        let project: Project | null = null;
        let newTaskHistory: TaskHistory[] = [];
        let filesMetaData: TaskFiles[] = [];

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

			newTask = await models.Task.create({
                title: task.title,
                description: task.description,
                priority: task.priority,
                deadline: task.deadline,
                assignedTo: task.assignedTo,
                assignedBy: task.assignedBy,
                fileAttachments: [],
                projectId: task.projectId,
                sprintId: task.sprintId
            },
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

					const key = `tasks/${newTask!.id}/${randomUUID()}-${file.filename}`;
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
							taskId: newTask!.id, 
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
            sprintId: task.sprintId,
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
                sprintId:task.sprintId,
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

}

export default new TaskService();
