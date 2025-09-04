import { models } from '../models';
import { taskConnectionsMap } from '../upgradeHandler';
import type { WebSocket as WSWebSocket } from 'ws';
import { GmailType } from './gmaiService';
import { sendEmailToQueue } from '@/queues';
import { AppError } from '@/types';

interface NewComment {
    message: string;
    memberId: number;
    taskId: number;
}

interface UpdatedComment {
	commentId: number;
	updatedComment: string;
	taskId: number;
}

interface commentToDelete {
	commentId: number;
	taskId: number;
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


export async function saveAndBroadcastComment({ 
	message, 
	memberId, 
	taskId 
}: NewComment) {

    const comment = await commentService.create(taskId, message, memberId);

    // Fetch the task to get assignee and assigner
    const task = await models.Task.findByPk(taskId, {
        include: [
            { model: models.ProjectMember, as: 'assignedToMember', include: [{ model: models.User, as: 'user', attributes: ['id', 'email'] }] },
            { model: models.ProjectMember, as: 'assignedByMember', include: [{ model: models.User, as: 'user', attributes: ['id', 'email'] }] }
        ]
    });

    if (!task) throw new Error('Task not found');

    // Only broadcast to assigner and assignee
    const allowedMemberIds = [task.assignedBy, task.assignedTo].filter(Boolean);

    // Prepare the comment payload
    const payload = JSON.stringify({
        type: 'new-comment',
        comment: {
            id: comment.id,
            message: comment.message,
            projectMemberId: comment.projectMemberId,
            taskId: comment.taskId,
            createdAt: comment.createdAt,
        },
    });

    broadcastComment(taskId, payload);

    const [ senderMember, project ] = await Promise.all([
        models.ProjectMember.findByPk(memberId, {include: [{ model: models.User, as: 'user' }]}),
        models.Project.findByPk(task.projectId)
    ]);

    const userRole: 'member' | 'manager' | 'admin' =
        senderMember!.roleId === 2 ? 'manager' :
        senderMember!.roleId === 3 ? 'member' :
        'admin';

    let notifyTarget = null;
    let page : 'assigned-tasks' | 'my-tasks' = 'my-tasks';

    if (task.assignedToMember.user.id !== senderMember!.user.id) {
        notifyTarget = task.assignedToMember.user;
    } else if (task.assignedByMember.user.id !== senderMember!.user.id) {
        notifyTarget = task.assignedByMember.user;
        page = 'assigned-tasks'
    }

    if (notifyTarget) {
        
        const link = `https://smart-desk-pro.xyz/projects/${task.projectId}/${page}/${taskId}/comments`;
        
        const notificationMessage = `<p>${escapeHtml(comment.message)} <a href="${link}" target="_blank" rel="noopener noreferrer">Посмотреть комментарий</a></p>`;

        
        await models.Notification.create({
            title: 'New Comment',
            message: notificationMessage,
            userId: notifyTarget.id,
        });

        await sendEmailToQueue({
            type: GmailType.TASK_COMMENT,
            receiverEmail: notifyTarget.email,
            params: [project!.title, task.title, senderMember!.projectId, taskId, userRole, senderMember!.position]
        });
    }

    return comment;

}

export async function updateAndBroadcastComment({
	commentId,
	updatedComment,
	taskId
} : UpdatedComment) {

	const comment = await commentService.update(taskId, commentId, updatedComment);

	if (!comment) throw new Error("Failed to update comment");

	const payload = JSON.stringify({
		type: 'updated-comment',
		updatedComment: {
			id: comment.id,
			message: comment.message,
			projectMemberId: comment.projectMemberId,
			taskId: comment.taskId,
			createdAt: comment.createdAt
		}
	});

	broadcastComment(taskId, payload);

	return comment;

};

export async function deleteAndBroadcastComment({
	commentId,
	taskId
} : commentToDelete) {

	const isDeleted = await commentService.remove(taskId, commentId);

	if (isDeleted) {

		const payload = JSON.stringify({
			type: "deleted-comment",
			deletedCommentId: commentId
		});

		broadcastComment(taskId, payload);

	}

}
 
function broadcastComment(taskId: number, payload: string) {

	const connections = taskConnectionsMap.get(taskId) as Set<WSWebSocket> | undefined;

    if (connections) {

        for (const ws of connections) {
            
            ws.send(payload);
        }

    }

}

export const commentService = {

    async getAll(taskId: number, projectId: number, userId: number) {

		const currentMember = await models.ProjectMember.findOne({
			where: { userId, projectId }
		});

		if (!currentMember) throw new AppError("Failed to find the current member", 404, true);

		const task = await models.Task.findByPk(taskId, {
			include: [
				{
					model: models.ProjectMember,
					as: "assignedByMember",
					include: [
						{
							model: models.User,
							as: "user"
						}
					]
				},
				{
					model: models.ProjectMember,
					as: "assignedToMember",
					include: [
						{
							model: models.User,
							as: "user"
						}
					]
				}
			]
		});
		
		if (!task) throw new AppError("Failed to find the task", 404, true);

		let chatPartner, currentUser;

		if (task.assignedByMember.id !== currentMember.id) {

			chatPartner = {
				name: task.assignedByMember.user.fullName,
				avatarUrl: task.assignedByMember.user.avatarUrl,
				position: task.assignedByMember.position
			};

			currentUser = {
				name: task.assignedToMember.user.fullName,
				avatarUrl: task.assignedToMember.user.avatarUrl,
				position: task.assignedToMember.position
			}

		} else if (task.assignedToMember.id !== currentMember.id) {

			chatPartner = {
				name: task.assignedToMember.user.fullName,
				avatarUrl: task.assignedToMember.user.avatarUrl,
				position: task.assignedToMember.position
			};

			currentUser = {
				name: task.assignedByMember.user.fullName,
				avatarUrl: task.assignedByMember.user.avatarUrl,
				position: task.assignedByMember.position
			}

		} else {

			chatPartner = {
				name: task.assignedByMember.user.fullName,
				avatarUrl: task.assignedByMember.user.avatarUrl,
				position: task.assignedByMember.position
			};

			currentUser = {
				name: task.assignedByMember.user.fullName,
				avatarUrl: task.assignedByMember.user.avatarUrl,
				position: task.assignedByMember.position
			}

		}

        const comments = await models.Comment.findAll({
            where: { taskId },
            order: [['createdAt', 'ASC']],
        });

		return {
			comments: comments,
			taskInfo: { title: task.title },
			chatPartner: chatPartner,
			currentUser: currentUser
		}

    },

    async create(taskId: number, message: string, memberId: number) {

        return models.Comment.create({
            message,
            projectMemberId: memberId,
            taskId,
        });

    },

    async update(taskId: number, commentId: number, message: string) {

        const comment = await models.Comment.findOne({ where: { id: commentId, taskId } });

        if (!comment) return null;

        comment.message = message;

        await comment.save();

        return comment;

    },

    async remove(taskId: number, commentId: number) {

        const comment = await models.Comment.findOne({ where: { id: commentId, taskId } });

        if (!comment) return false;

        await comment.destroy();

        return true;

    },

};
