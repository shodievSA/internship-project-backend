import { models } from '../models';
import { taskConnectionsMap } from '../upgradeHandler';
import type { WebSocket as WSWebSocket } from 'ws';
import { GmailType } from './gmaiService';
import { sendEmailToQueue } from '@/queues';

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

    const [ projectMember, project ] = await Promise.all([
        models.ProjectMember.findByPk(memberId, {include: [{ model: models.User, as: 'user' }]}),
        models.Project.findByPk(task.projectId)
    ]);

    const userRole: 'member' | 'manager' | 'admin' =
        projectMember!.roleId === 2 ? 'manager' :
        projectMember!.roleId === 3 ? 'member' :
        'admin';

    let notifyTarget = null;

    if (task.assignedToMember.user.id !== projectMember!.user.id) {
        notifyTarget = task.assignedToMember.user;
    } else if (task.assignedByMember.user.id !== projectMember!.user.id) {
        notifyTarget = task.assignedByMember.user;
    }

    if (notifyTarget) {
        await models.Notification.create({
            title: 'New Comment',
            message: message,
            userId: notifyTarget.id,
        });

        await sendEmailToQueue({
            type: GmailType.TASK_COMMENT,
            receiverEmail: notifyTarget.email,
            params: [project!.title, task.title, projectMember!.projectId, taskId, userRole, projectMember!.position]
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

// REST API service functions
export const commentService = {

    async getAll(taskId: number) {

        return models.Comment.findAll({
            where: { taskId },
            order: [['createdAt', 'ASC']],
        });

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
