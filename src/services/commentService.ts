import { models } from '../models';
import { taskConnectionsMap } from '../index';
import type { WebSocket as WSWebSocket } from 'ws';

interface NewComment {
    message: string;
    memberId: number;
    taskId: number;
}

export async function saveAndBroadcastComment({ message, memberId, taskId }: NewComment) {
    // Save the comment in the database
    const comment = await models.Comment.create({
        message,
        projectMemberId: memberId,
        taskId,
    });

    // Fetch the task to get assignee and assigner
    const task = await models.Task.findByPk(taskId);
    if (!task) throw new Error('Task not found');

    // Only broadcast to assigner and assignee
    const allowedMemberIds = [task.assignedBy, task.assignedTo].filter(Boolean);

    // Prepare the comment payload
    const payload = JSON.stringify({
        type: 'new-comment',
        comment: {
            id: comment.id,
            message: comment.message,
            memberId: comment.projectMemberId,
            taskId: comment.taskId,
            createdAt: comment.createdAt,
        },
    });

    // Broadcast to all connections in the room for this task
    const connections = taskConnectionsMap.get(taskId) as Set<WSWebSocket> | undefined;
    if (connections) {
        for (const ws of connections) {
            // Optionally, you could check if the ws belongs to allowedMemberIds
            ws.send(payload);
        }
    }

    return comment;
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
