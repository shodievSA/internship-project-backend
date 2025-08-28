import sequelize from '../config/sequelize';
import { models } from '../models';
import { Transaction } from 'sequelize';
import { AppError, TeamMember, MemberProductivity } from '@/types';
import { GmailType } from '../services/gmaiService';
import { sendEmailToQueue } from '@/queues';

class TeamMemberService {

	async updateTeamMemberRole(
		projectId: number, 
		memberId: number, 
		newRole: string
	): Promise<TeamMember> {

		try {
		
			const role = await models.Role.findOne({ where: { name: newRole }});

			if (!role) throw new AppError("The provided role is invalid", 400, true);
		
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
		
			if (count === 0) throw new AppError("Failed to update team member role", 500, true);

			const project = await models.Project.findByPk(projectId, {
				attributes: ['title']
			});

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

		} catch (err) {

            throw err;

		}

	}

	async removeTeamMember(projectId: number, memberId: number): Promise<void> {

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

			if (!userToRemove) throw new AppError("Failed to find the team member", 404, true);
			if (!project) throw new AppError(`Failed to find project with id ${projectId}`, 404, true);

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

		} catch (err) {

			await transaction.rollback();
			throw err;
			
		}

	}

    async getMemberProductivity(
		projectId: number, 
		memberId: number
	): Promise<MemberProductivity | null> {

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
            });

            if (!member) throw new AppError(`Failed to find project member with id ${memberId}`, 404, true);

            let memberOngoingTasksCount = 0; 
            let memberCompletedTasksCount = 0; 
            let memberRejectedTasksCount = 0; 
            let memberUnderReviewTasksCount = 0; 
            let memberOverdueTasksCount = 0; 

            const memberTotalTasks = await models.Task.findAndCountAll({
                where: { 
                    projectId: projectId, 
                    assignedTo: member?.id,
                },
                order: [["created_at", "DESC"]],
            });
            
            let totalTime: number = 0; 

            if (memberTotalTasks.count === 0) {

				return null;

            } else { 

				for (const task of memberTotalTasks.rows) { 

                    totalTime += (new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime())/ (3_600_000);
                    
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

			}

            const avgCompletionTimeInHours: number = memberCompletedTasksCount > 0 ? Number((totalTime / memberCompletedTasksCount).toFixed(1)) : 0;
            const completionRate: number = memberTotalTasks.count > 0 ? memberCompletedTasksCount / memberTotalTasks.count : 0;
            const productivityScore = Math.round(completionRate * 60 + (1-(avgCompletionTimeInHours/8)) * 20 + (1-((memberOverdueTasksCount + memberRejectedTasksCount)/memberTotalTasks.count)) * 20) || 0;

            const recentActivityRaw = await models.Task.findAll({
                where: { 
                    projectId: projectId, 
                    assignedTo: member?.id,
                },
                attributes : ["title", "status", "updatedAt"],
                order: [["updated_at", "DESC"]],
                limit: 5,
            });

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

                const hoursSinceUpdate = Number(((Date.now() - new Date(task.updatedAt).getTime())/3_600_000).toFixed(1));

                result.recentActivity.push({
                    title:task.title,
                    status: task.status,
                    time: hoursSinceUpdate
                });

            }

            return result;

        } catch (err) { 

            throw err;

        }
    
    }

}

export default new TeamMemberService();
