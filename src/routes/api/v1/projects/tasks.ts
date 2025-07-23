import projectController from "../../../../controllers/projectController";
import { RequestHandler, Router } from "express";
import { commentController } from '../../../../controllers/commentController';
import { upload } from '@/middlewares/fileUploads';

const router = Router({ mergeParams: true });

router.post('/', upload.array('fileAttachments'), projectController.createTask as RequestHandler);
router.patch('/:taskId/status', projectController.changeTaskStatus as RequestHandler);
router.patch('/:taskId', upload.array('fileAttachments'), projectController.updateTask as RequestHandler);
router.delete('/:taskId', projectController.deleteTask as RequestHandler);
router.get('/:taskId/files', projectController.getTaskFiles as RequestHandler);

// Comment endpoints
router.get('/:taskId/comments', commentController.getAll as RequestHandler);
router.post('/:taskId/comments', commentController.create as RequestHandler);
router.put('/:taskId/comments/:commentId', commentController.update as RequestHandler);
router.delete('/:taskId/comments/:commentId', commentController.remove as RequestHandler);

export default router;
