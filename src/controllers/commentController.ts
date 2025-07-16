import { Request, Response, NextFunction } from "express";
import { commentService, deleteAndBroadcastComment, updateAndBroadcastComment } from "../services/commentService";
import { taskConnectionsMap } from "../index";
import type { WebSocket as WSWebSocket } from "ws";
import { saveAndBroadcastComment } from "../services/commentService";

interface JoinCommentSectionMsg {
	type: "join-comment-section";
	taskId: number;
}

interface NewCommentMsg {
	type: "new-comment";
	message: string;
	memberId: number;
	taskId: number;
}

interface UpdateCommentMsg {
	type: "update-comment";
	commentId: number;
	updatedComment: string;
	taskId: number;
}

interface DeleteCommentMsg {
	type: "delete-comment";
	commentId: number;
	taskId: number;
}

type IncomingMsg = JoinCommentSectionMsg | NewCommentMsg | UpdateCommentMsg | DeleteCommentMsg;

export function handleCommentWSConnection(ws: WSWebSocket) {

	let joinedTaskId: number | null = null;

	ws.on("message", async (data: string) => {

		try {

			const msg: IncomingMsg = JSON.parse(data);

			if (msg.type === "join-comment-section") {

				// Add ws to the set for this taskId
				joinedTaskId = msg.taskId;

				if (!taskConnectionsMap.has(msg.taskId)) {

					taskConnectionsMap.set(msg.taskId, new Set<WSWebSocket>());

				}

				taskConnectionsMap.get(msg.taskId)!.add(ws);

			} else if (msg.type === "new-comment") {

				await saveAndBroadcastComment({
					message: msg.message,
					memberId: msg.memberId,
					taskId: msg.taskId,
				});

			} else if (msg.type === "update-comment") {

				await updateAndBroadcastComment({
					commentId: msg.commentId,
					updatedComment: msg.updatedComment,
					taskId: msg.taskId
				});

			} else if (msg.type === "delete-comment") {

				await deleteAndBroadcastComment({
					commentId: msg.commentId,
					taskId: msg.taskId
				});

			}

		} catch (err) {

			ws.send(
				JSON.stringify({
					type: "error",
					message: "Invalid message or server error.",
				})
			);

		}

	});

	ws.on("close", () => {
		// Remove ws from the set for the joined taskId
		if (joinedTaskId !== null) {

			const set = taskConnectionsMap.get(joinedTaskId);

			if (set) {

				set.delete(ws);

				if (set.size === 0) {
					taskConnectionsMap.delete(joinedTaskId);
				}

			}

		}

	});

}

export const commentController = {

	async getAll(req: Request, res: Response, next: NextFunction) {

		try {

			const { taskId } = req.params;
			const comments = await commentService.getAll(Number(taskId));

			res.json({ comments });

		} catch (err) {

			next(err);

		}

	},

	async create(req: Request, res: Response, next: NextFunction) {

		try {

			const { taskId } = req.params;
			const { message, memberId } = req.body;

			const comment = await commentService.create(
				Number(taskId),
				message,
				memberId
			);

			res.status(201).json(comment);

		} catch (err) {

			next(err);

		}

	},

	async update(req: Request, res: Response, next: NextFunction) {

		try {

			const { taskId, commentId } = req.params;
			const { message } = req.body;
			const comment = await commentService.update(
				Number(taskId),
				Number(commentId),
				message
			);

			if (!comment) return res.status(404).json({ message: "Comment not found" });

			res.json(comment);

		} catch (err) {

			next(err);

		}

	},

	async remove(req: Request, res: Response, next: NextFunction) {

		try {

			const { taskId, commentId } = req.params;
			const deleted = await commentService.remove(
				Number(taskId),
				Number(commentId)
			);

			if (!deleted) return res.status(404).json({ message: "Comment not found" });

			res.status(204).send();

		} catch (err) {

			next(err);

		}
		
	}

};
