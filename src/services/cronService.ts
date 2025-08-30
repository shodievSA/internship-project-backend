import cron from 'node-cron';
import Task from '@/models/task';
import User from '@/models/user';
import Notification from '@/models/notification';
import { literal, Op, Transaction, where } from 'sequelize';
import { AppError } from '@/types';
import ProjectMember from '@/models/projectMember';
import Project from '@/models/project';
import { DateTime } from "luxon";
import { 
	TaskDueToday, 
	TaskDueTomorrow, 
	TaskDueThisWeek, 
	TaskForReview, 
	NewNotification
} from '@/types/dailyReport';
import DailyAiReport from '@/models/dailyAiReport';
import aiService from './aiService';
import { models } from '@/models';
import sequelize from '@/config/sequelize';

async function markOverdueTasks() {

    const transaction: Transaction = await sequelize.transaction();

    try {
        const tz = 'Asia/Tashkent'

        const [updatedCount, updatedTasks] = await Task.update(
            { status: 'overdue' },
            {
                where: {
                    [Op.and]: [
                        where(
                            literal(`deadline AT TIME ZONE '${tz}'`),
                            '<',
                            literal(`(now() AT TIME ZONE '${tz}')`)
                        ),
                       { status: ['ongoing', 'under review', 'rejected']},
                    ],
                },
                returning: true,
                transaction: transaction,
            },
            
        );

        if (updatedCount > 0) {
            console.log(`Marked ${updatedCount} tasks as overdue.`);
        }

        for (const task of updatedTasks) { 

            await models.TaskHistory.create({
                taskId: task.id,
                status: 'overdue',
            },
            {transaction : transaction}
            )
        }

        await transaction.commit()

    } catch (err) {

        await transaction.rollback()

        throw new AppError(`Error marking overdue tasks: ${err}`);

    }

}

async function generateReport() {

	const tashkent = DateTime.now().setZone("Asia/Tashkent");
	const endOfWeek = DateTime.now().endOf("week");
	
	const currentDay = tashkent.day;
	const lastDay = endOfWeek.day;

	function wait(ms: number) {

		return new Promise((resolve) => setTimeout(resolve, ms));

	}

	try {

		const users = await User.findAll({
			attributes: ["id"],
			include: [
				{
					model: Notification,
					as: "notifications",
					where: { isViewed: false }
				},
				{
					model: ProjectMember,
					as: "projectMembers",
				}
			]
		});

		for (const user of users) {

			const tasksDueToday: TaskDueToday[] = [];
			const tasksDueTomorrow: TaskDueTomorrow[] = [];
			const tasksDueThisWeek: TaskDueThisWeek[] = [];
			const tasksForReview: TaskForReview[] = [];
			const newNotifications: NewNotification[] = [];

			for (const userMemberId of user.projectMembers) {

				const userTasks = await Task.findAll({
					where: {
						assignedTo: userMemberId.id,
						status: "ongoing"
					},
					include: [
						{
							model: Project,
							as: "project",
							attributes: ["id", "title"]
						},
						{
							model: ProjectMember,
							as: "assignedByMember",
							include: [
								{
									model: User,
									as: "user",
									attributes: ["fullName", "avatarUrl"]
								}
							]
						}
					]
				});

				for (const userTask of userTasks) {

					const deadline = userTask.deadline.toISOString();
					const deadlineDay = DateTime.fromISO(deadline).day;

					const task = {
						id: userTask.id,
						title: userTask.title,
						description: userTask.description,
						priority: userTask.priority,
						deadline: userTask.deadline,
						assignedBy: {
							name: userTask.assignedByMember.user.fullName,
							avatarUrl: userTask.assignedByMember.user.avatarUrl
						},
						from: {
							projectId: userTask.project.id,
							projectName: userTask.project.title
						}
					} as TaskDueToday;

					if (deadlineDay === currentDay) {

						tasksDueToday.push(task);

					} else if (deadlineDay === currentDay + 1) {

						tasksDueTomorrow.push(task);

					} else if (deadlineDay < lastDay) {

						tasksDueThisWeek.push(task);

					}

				}

				const userReviewTasks = await Task.findAll({
					where: { 
						assignedBy: userMemberId.id, 
						status: "under review" 
					},
					include: [
						{
							model: Project,
							as: "project",
							attributes: ["id", "title"]
						},
						{
							model: ProjectMember,
							as: "assignedToMember",
							include: [
								{
									model: User,
									as: "user",
									attributes: ["fullName", "avatarUrl"]
								}
							]
						}
					]
				});

				for (const userReviewTask of userReviewTasks) {

					const task = {
						id: userReviewTask.id,
						title: userReviewTask.title,
						description: userReviewTask.description,
						priority: userReviewTask.priority,
						deadline: userReviewTask.deadline,
						assignedTo: {
							name: userReviewTask.assignedToMember.user.fullName,
							avatarUrl: userReviewTask.assignedToMember.user.avatarUrl
						},
						from: {
							projectId: userReviewTask.project.id,
							projectName: userReviewTask.project.title
						}
					} as TaskForReview;

					tasksForReview.push(task);

				}

			}

			for (const newNotification of user.notifications) {

				const notification = {
					id: newNotification.id,
					title: newNotification.title,
					message: newNotification.message,
					createdAt: newNotification.createdAt
				};

				newNotifications.push(notification);

			}
            const report = {
                tasksDueToday,
                tasksDueTomorrow,
                tasksDueThisWeek,
                tasksForReview,
                newNotifications
                
				}
           
            const summary = await aiService.generateWorkPlanSummary(report);

			await DailyAiReport.create({
				userId: user.id,
				report: {
                    ...report,
                    summary
				}
			});

			await wait(5000);

		}

	} catch(err) {

		console.log(err);

	}

}

export async function startCronJobs() {
    
    cron.schedule(
		'10 0 0 * * *', 
		markOverdueTasks, 
		{
			timezone: "Asia/Tashkent"
		}
	);

    await markOverdueTasks();

	cron.schedule(
		'0 0 5 * * *', 
		generateReport,
		{
			timezone: "Asia/Tashkent"
		}
	); 
	
	await generateReport();

}

export { markOverdueTasks }; 