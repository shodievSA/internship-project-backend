import taskController from "../../../../controllers/taskController";
import { RequestHandler, Router } from "express";
import { commentController } from '../../../../controllers/commentController';
import { upload } from '@/middlewares/fileUploads';

const router = Router({ mergeParams: true });

router.post('/', upload.array('fileAttachments'), taskController.createTask as RequestHandler);
router.patch('/:taskId/status', taskController.changeTaskStatus as RequestHandler);
router.patch('/:taskId', upload.fields([{ name: 'filesToAdd', maxCount: 10 }]), taskController.updateTask as RequestHandler);
router.delete('/:taskId', taskController.deleteTask as RequestHandler);
router.get('/:taskId/files', taskController.getTaskFiles as RequestHandler);

// Comment endpoints
router.get('/:taskId/comments', commentController.getAll as RequestHandler);
router.post('/:taskId/comments', commentController.create as RequestHandler);
router.put('/:taskId/comments/:commentId', commentController.update as RequestHandler);
router.delete('/:taskId/comments/:commentId', commentController.remove as RequestHandler);

export default router;
